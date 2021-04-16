import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'health-checker-service',
    brokers: ['localhost:9092'],
  });  
  
const initProducer = async () => {
    const producer = kafka.producer()
    await producer.connect();
    return producer;
};

const initConsumer = async () => {
    const consumer = kafka.consumer({ groupId: 'health-check-service' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'http-request-check', fromBeginning: true });
    return consumer;
}

const sendMessage = async () => {
    const producer = await initProducer();
    await producer.send({
        topic: 'test-topic',
        messages: [
            { value: JSON.stringify({id: 233455, message: 'Hello KafkaJS user!'}) },
        ]
    });
    await producer.disconnect();
}

const kafkaMessageReader = async () => {
    const consumer = await initConsumer();
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                topic,
                partition,
                value: JSON.parse(message.value.toString()),
            });
        },
    });
}

// sendMessage();
kafkaMessageReader();
