import {Logger} from "tslog";
import * as fs from "fs";
import {BaseStationMessage} from "./basestation/BaseStationMessage";
import axios, {AxiosError} from "axios";
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
            host: this.config['socketHost'],
            port: this.config['socketPort'],
        });
        this.socketServer.listen();
        this.socketServer.onConnection((client: Client) => {
            this.log.info("Client connected: " + client.getRemoteAddress() + ":" + client.getRemotePort());
            if (!this.config['allowedRemotes'].includes(client.getRemoteAddress())) {
                client.sendString("You are not allowed to connect to this server\n");
                client.close();
                this.log.warn("Client not allowed to connect: " + client.getRemoteAddress() + ":" + client.getRemotePort());
            }
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
        for (const server of this.config['servers']) {
            let proxy;
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
                        'Referer': server.referer !== undefined ? server.referer : server.host,
                    }
                };
                if (this.config['proxies'].length > 0) {
                    if (server.useProxy) {
                        if (server.proxyOverride === undefined) {
                            proxy = this.config['proxies'][Math.floor(Math.random() * this.config['proxies'].length)];
                        } else {
                            proxy = server.proxyOverride;
                        }
                        // @ts-ignore
                        axiosConfig.proxy = {
                            host: proxy.split(":")[0],
                            port: parseInt(proxy.split(":")[1])
                        };
                    }

                }
                const serverData = await axios.get(server['host'], axiosConfig);
                this.log.info("Fetched data from " + server.name + " with format " + server.format + " using proxy " + (server.useProxy === 'true' ? 'Yes' : 'No') + (proxy !== undefined ? ' ' + proxy : ''));
                let rx = this.parsePlaneList(serverData.data, server['format']);
                this.socketServer.clients.forEach((client: Client) => {
                    client.sendString(rx);
                });
                rx = '';
            } catch (e: any | AxiosError) {
                const errorMsg = e.code === 'ECONNABORTED' ? 'Timeout' : e?.response?.status;
                this.log.error("Error while fetching data from " + server['host'] + " using proxy " + (server.useProxy === 'true' ? 'Yes' : 'No') + (proxy !== undefined ? ' ' + proxy : ''));
                this.log.error("Error code was: " + errorMsg);
                // this.log.error(e);
                // return process.exit(1);
            }
        }

        //broadcast to socket
        // this.log.info("Sending data to socket");
        // this.log.info(rx);
        // this.socketServer.clients.forEach((client: Client) => {
        //     client.sendString(rx);
        // });
        this.log.info("Loop completed");
    }

}

export const Dump1090Encoder = new Encoder();

