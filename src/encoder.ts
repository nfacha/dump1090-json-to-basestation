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
            if (data.length === 0) {
                return '';
            }
            for (const aircraft of data) {
                if (aircraft.validposition !== 1) {
                    // this.log.debug("Invalid position");
                    continue;
                }
                rx += new BaseStationMessage(aircraft.hex, aircraft.flight !== undefined ? aircraft.flight.trim() : '', aircraft.speed, aircraft.track, aircraft.lat, aircraft.lon, aircraft.vert_rate, aircraft.squawk, aircraft.altitude).generate();
            }
        } else if (format === 'aircraft-json') {
            for (const aircraft of data.aircraft) {
                rx += new BaseStationMessage(aircraft.hex, aircraft.flight !== undefined ? aircraft.flight.trim() : '', aircraft.gs, aircraft.track, aircraft.lat, aircraft.lon, aircraft.baro_rate, aircraft.squawk, aircraft.alt_baro).generate();
            }
        } else if (format === 'vrs-aircraft-json') {
            for (const aircraft of data.acList) {
                rx += new BaseStationMessage(aircraft.ICAO, aircraft.Call !== undefined ? aircraft.Call.trim() : '', aircraft.Spd, aircraft.Track, aircraft.Lat, aircraft.Long, aircraft.Vsi, aircraft.Sqk, aircraft.Alt).generate();
            }
        }


        return rx
    }

    public async updateData() {
        let rx = '';
        for (const server of this.config['servers']) {
            try {
                let timeout = this.config['timeout'] * 1000;
                if (server.timeoutOverride !== undefined) {
                    timeout = server.timeoutOverride * 1000;
                    this.log.debug("Timeout overridden to " + server.timeoutOverride + "s for server" + server.name);
                }
                let axiosConfig = {
                    timeout: timeout,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
                    }
                };
                if (this.config['proxies'].length > 0) {
                    if (server.useProxy) {
                        const proxy = this.config['proxies'][Math.floor(Math.random() * this.config['proxies'].length)];
                        // @ts-ignore
                        axiosConfig.proxy = {
                            host: proxy.split(":")[0],
                            port: parseInt(proxy.split(":")[1])
                        };
                        this.log.debug("Using proxy " + proxy + " for server " + server.name);
                    }

                }
                const serverData = await axios.get(server['host'], axiosConfig);
                this.log.info("Fetched data from " + server.name + "with format " + server.format);
                rx += this.parsePlaneList(serverData.data, server['format']);
            } catch (e) {
                this.log.error("Error while fetching data from " + server['host']);
                // this.log.error(e);
                // return process.exit(1);
            }
        }

        //broadcast to socket
        // this.log.info("Sending data to socket");
        // this.log.info(rx);
        this.socketServer.clients.forEach((client: Client) => {
            client.sendString(rx);
        });
        this.log.info("Data sent to BaseStation socket");
    }

}

export const Dump1090Encoder = new Encoder();

