export class BaseStationMessage{
    public messageType = 'MSG';
    public onGround = false;
    public sessionId = 0;
    public aircraftId = 0;
    public hexIdent = '';
    public flightId = 0;
    public dateMessageGenerated = '';
    public timeMessageGenerated = '';
    public dateMessageLogged = '';
    public timeMessageLogged = '';
    public callsign = '';
    public groundSpeed: number | string = 0;
    public track: number | string = 0;
    public latitude: number | string = 0;
    public longitude: number | string = 0;
    public verticalrate: number | string = 0;
    public squawk: number | string = 0;
    public squawkHasChanged = 0;
    public emergency = 0;
    public identActive = 0;
    public altitude: number | string = 0;


    constructor(hexIdent: string, callsign: string, groundSpeed: number, track: number, latitude: number, longitude: number, verticalrate: number, squawk: number, altitude: number) {
        let currentDate = new Date()
        let day = currentDate.getDate() <= 9 ? '0' + currentDate.getDate() : currentDate.getDate()
        let month = (currentDate.getMonth() + 1) <= 9 ? '0' + (currentDate.getMonth() + 1) : (currentDate.getMonth() + 1)
        let year = currentDate.getFullYear()
        this.hexIdent = hexIdent !== undefined ? hexIdent : ''
        this.dateMessageGenerated = year + '/' + month + '/' + day;
        this.timeMessageGenerated = currentDate.toTimeString().split(' ')[0];
        this.dateMessageLogged = this.dateMessageGenerated;
        this.timeMessageLogged = this.timeMessageGenerated;
        this.callsign = callsign !== undefined ? callsign : ''
        this.groundSpeed = groundSpeed !== undefined ? groundSpeed : '';
        this.track = track !== undefined ? track : '';
        this.latitude = latitude !== undefined ? latitude : '';
        this.longitude = longitude !== undefined ? longitude : '';
        this.verticalrate = verticalrate !== undefined ? verticalrate : '';
        this.squawk = squawk !== undefined ? squawk : '';
        this.altitude = altitude !== undefined ? altitude : '';
    }

    public generate(){
        if (this.hexIdent == '') {
            return '';
        }
        if (this.altitude == 'ground') {
            this.altitude = 0;
        }
        const transmissionMessageType = this.onGround ? '3' : '2';
        return `${this.messageType},${transmissionMessageType},${this.sessionId},${this.aircraftId},${this.hexIdent.toUpperCase()},${this.flightId},${this.dateMessageGenerated},${this.timeMessageGenerated}.000,${this.dateMessageLogged},${this.timeMessageLogged}.000,${this.callsign},${this.altitude},${this.groundSpeed},${this.track},${this.latitude},${this.longitude},${this.verticalrate},${this.squawk},${this.squawkHasChanged},${this.emergency},${this.identActive},${this.onGround ? -1 : 0}\n`;
    }
}
