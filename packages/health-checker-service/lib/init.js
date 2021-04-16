"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const kafkajs_1 = require("kafkajs");
const kafka = new kafkajs_1.Kafka({
    clientId: 'health-checker-service',
    brokers: ['localhost:9092']
});
const initProducer = () => __awaiter(void 0, void 0, void 0, function* () {
    const producer = kafka.producer();
    yield producer.connect();
    return producer;
});
const initConsumer = () => __awaiter(void 0, void 0, void 0, function* () {
    const consumer = kafka.consumer({ groupId: 'test-group' });
    yield consumer.connect();
    yield consumer.subscribe({ topic: 'test-topic', fromBeginning: false });
    return consumer;
});
const sendMessage = () => __awaiter(void 0, void 0, void 0, function* () {
    const producer = yield initProducer();
    yield producer.send({
        topic: 'test-topic',
        messages: [
            { value: JSON.stringify({ id: 233455, message: 'Hello KafkaJS user!' }) },
        ]
    });
    yield producer.disconnect();
});
const kafkaMessageReader = () => __awaiter(void 0, void 0, void 0, function* () {
    const consumer = yield initConsumer();
    yield consumer.run({
        eachMessage: ({ topic, partition, message }) => __awaiter(void 0, void 0, void 0, function* () {
            console.log({
                topic,
                partition,
                value: JSON.parse(message.value.toString()),
            });
        })
    });
});
kafkaMessageReader();
//# sourceMappingURL=init.js.map