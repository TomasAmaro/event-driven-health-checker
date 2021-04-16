import { schedule } from 'node-cron';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { sendMessage } from './kafka';


const testServices: Array<Service> = [
    {
        name: 'Google',
        url: 'http://google.com',
        maxLatency: 350,
    },
    {
        name: 'Hostelworld',
        url: 'http://hostelworld.com',
        maxLatency: 700,
    },
    {
        name: 'OffTest',
        url: 'http://gjdjsfjsdgjdfg.com',
        maxLatency: 60,
    }
];

enum KafkaTopics {
    HTTP_REQ_CHECK = 'http-request-check',
    SERVICE_CREATED = 'service-created'
}

type Service = { url: string; name: any; maxLatency: number; };
type Timed = { config: { reqStartedAt: number } }
type TimedRequestConfig = AxiosRequestConfig & Timed;
type TimedResponseConfig = AxiosResponse<any> & Timed;
type ExecutedTimedResponse = AxiosResponse<any> & { execTime: number };

axios.interceptors.request.use( (req: TimedRequestConfig) => ({...req, reqStartedAt: new Date().getTime()}));
axios.interceptors.response.use((res: TimedResponseConfig): ExecutedTimedResponse => {
    const execTime = new Date().getTime() - res.config.reqStartedAt;
    return {...res, execTime};
});

const getServiceStatus = (response: ExecutedTimedResponse, maxLatency: number) => {
    const { execTime } = response;
    const distance = maxLatency - execTime;
    const LIMIT = 20;
    const MULTIPLIER = 5;

    if(response.config.timeout) {
        return 'off';
    }

    if (distance < 0) {
        return 'urgent';
    }

    if(distance > LIMIT) {
        return distance > (LIMIT * MULTIPLIER) ? 'excelent' : 'good';
    }

    return 'bad';
}

interface PerformanceData {
    serviceName: string,
    status: string,
    executionTime: number,
    error?: string,
};

const getPerformanceData = async (service: Service): Promise<PerformanceData> => {
        try {
            const response: ExecutedTimedResponse = await axios.get(service.url);
            console.log(response.status);
            return {
                serviceName: service.name,
                status: getServiceStatus(response, service.maxLatency),
                executionTime: response.execTime,
            }
        } catch (error) {
            return {
                serviceName: service.name,
                status: 'off',
                executionTime: 0,
                error: error.message,
            }
        }
    };

const task = schedule('*/5 * * * * *', () => {
    testServices.map( service => {
        getPerformanceData(service)
        .then(res => sendMessage(JSON.stringify(res), KafkaTopics.HTTP_REQ_CHECK))
        .catch(err => console.error(err));
    });
});

testServices.forEach(s => sendMessage(JSON.stringify(s), KafkaTopics.SERVICE_CREATED));

console.log('[Request-Service] - Started normally');