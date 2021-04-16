import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Unique } from "typeorm";
import { Request } from "./request";

@Entity()
@Unique(['name', 'url'])
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    maxLatency: number;

    @Column()
    url: string;

    @OneToMany(type => Request, request => request.service) // note: we will create author property in the Photo class below
    requests: Request[];
}