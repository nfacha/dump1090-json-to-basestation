import {Logger} from "tslog";
import * as fs from "fs";
import {BaseStationMessage} from "./basestation/BaseStationMessage";
import axios from "axios";
import {Client, TCPServer} from "pocket-sockets";


class Encoder {
    public log: Logger;
    public config: any;
    public socketServer: TCPServer;


    constructor() {
        this.log = new Logger();
        this.log.info("Encoder started");
        this.config = this.loadConfig();
        this.log.info("Config loaded");
        this.socketServer = new TCPServer({
            host: "127.0.0.1",
            port: 20004,
        });
        this.socketServer.listen();
        this.socketServer.onConnection((client: Client) => {
            this.log.info("Client connected: " + client.clientOptions?.host + ":" + client.clientOptions?.port);
        });


        setInterval(() => {
            this.updateData();
        }, this.config['refreshInterval'] * 1000);
        this.updateData();
    }

    private loadConfig() {
        return JSON.parse(fs.readFileSync("./config.json", "utf8"));
    }

    public parsePlaneList(data: any, format: string): string {
        let rx = '';
        if(format === 'data-json'){
            for (const aircraft of data) {
                if(aircraft.validposition !== 1){
                    this.log.debug("Invalid position");
                    continue;
                }
                rx += new BaseStationMessage(aircraft.hex, aircraft.flight.trim(),aircraft.speed, aircraft.track,aircraft.lat, aircraft.lon,aircraft.vert_rate, aircraft.squawk, aircraft.altitude).generate();
            }
        }else if(format === 'aircraft-json'){
            for (const aircraft of data.aircraft) {
                rx += new BaseStationMessage(aircraft.hex, aircraft.flight.trim(), aircraft.gs, aircraft.track, aircraft.lat, aircraft.lon, aircraft.baro_rate, aircraft.squawk, aircraft.alt_baro).generate();
            }
        }

        return rx
    }

    public async updateData() {
        let rx = '';
        for (const server of this.config['servers']) {
            try {
                const serverData = await axios.get(server['host']);
                rx += this.parsePlaneList(serverData.data, server['format']);
            } catch (e) {
                this.log.error(e);
            }
        }

        //broadcast to socket
        this.log.info("Sending data to socket");
        this.log.info(rx);
        this.socketServer.clients.forEach((client: Client) => {
            client.sendString(rx);
        });
    }

}

export const Dump1090Encoder = new Encoder();

