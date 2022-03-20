import {Logger} from "tslog";
import * as fs from "fs";

class Encoder {
    public log: Logger;
    public config: any;


    constructor() {
        this.log = new Logger();
        this.log.info("Encoder started");
        this.config = this.loadConfig();
    }

    private loadConfig() {
        return JSON.parse(fs.readFileSync("./config.json", "utf8"));
    }
}
