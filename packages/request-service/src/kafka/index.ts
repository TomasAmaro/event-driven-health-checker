import { Kafka } from "kafkajs";
import { v4 as uuidv4 } from 'uuid';


const kafka = new Kafka({
    clientId: 'request-service',
    brokers: ['localhost:9092']
  });  
  
const initProducer = async () => {
    const producer = kafka.producer()
    await producer.connect();
    return producer;
};

export const sendMessage = async (message: string = 'Hello KafkaJS user!', topic: string = 'http-request-check') => {
    const producer = await initProducer();
    await producer.send({
        topic,
        messages: [
            { value: JSON.stringify({id: uuidv4(), message}) },
        ]
    });
    // await producer.disconnect();
}