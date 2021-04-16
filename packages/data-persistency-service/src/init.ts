import { createConnection, Connection } from "typeorm";
import { Service } from './models';
import "reflect-metadata";
import { Kafka } from 'kafkajs';
import { Request } from "./models/request";

enum KafkaTopics {
    HTTP_REQ_CHECK = 'http-request-check',
    SERVICE_CREATED = 'service-created'
}

const kafka = new Kafka({
    clientId: 'data-persistency-service',
    brokers: ['localhost:9092'],
  });

const initConsumer = async () => {
    const consumer = kafka.consumer({ groupId: 'health-check-service' });
    await consumer.connect();
    await consumer.subscribe({ topic: KafkaTopics.HTTP_REQ_CHECK, fromBeginning: false });
    await consumer.subscribe({ topic: KafkaTopics.SERVICE_CREATED, fromBeginning: false });
    return consumer;
}

const initConnection = async () => {
    try {
        return await createConnection({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'unicorn_user',
            password: 'magical_password',
            database: 'rainbow_database',
            synchronize: true,
            entities: [Service, Request],
        });
    } catch (error) {
        console.error(error);    
    }   
};

const addService = async (connection: Connection, service: Partial<Service>) => {
    const repository = connection.getRepository(Service);
    return await repository.save(service);
}

const getAllServices = async (connection: Connection) => {
    const repository = connection.getRepository(Service);
    return await repository.find();
}

const addRequest = async (connection: Connection, request: Partial<Request>) => {
    const repository = connection.getRepository(Request);
    return await repository.save(request);
} 

(async () => {
    const connection = await initConnection();
    // await addService(connection, {
    //     name: 'Hostelworld',
    //     url: 'http://hostelworld.com',
    //     maxLatency: 700,
    //     requests: [],
    // });


    const consumer = await initConsumer();
    let allServices: Service[] = await getAllServices(connection);
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            
            console.log(topic, message);
            const parsedMessage = JSON.parse(message.value.toString());
            const messageId: string = parsedMessage.id; 
            const data = JSON.parse(parsedMessage.message);

            console.log(data);

            if (topic === KafkaTopics.SERVICE_CREATED) {
                try {
                    const service = await addService(connection, {...data, requests: []});
                    allServices = [...allServices, service];
                } catch (error) {
                    console.error(error.message);
                }
            }

            if (topic === KafkaTopics.HTTP_REQ_CHECK) {
                const service: Service = allServices.find(s => s.name === data.serviceName); 
                delete data.error;
                const request = await addRequest(connection, {...data, reqId: messageId, service});
                console.log(request);
            }
        },
    });
    console.log(allServices);
})();
