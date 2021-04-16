import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Service } from "./service";

@Entity()
export class Request {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    reqId: string;

    @ManyToOne(type => Service, service => service.requests)
    service: Service

    @Column()
    executionTime: number;

    @Column()
    status: string;
}