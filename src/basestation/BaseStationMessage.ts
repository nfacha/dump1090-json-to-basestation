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
    public groundSpeed = 0;
    public track = 0;
    public latitude = 0;
    public longitude = 0;
    public verticalrate = 0;
    public squawk = 0;
    public squawkHasChanged = 0;
    public emergency = 0;
    public identActive = 0;
    public altitude = 0;


    constructor(hexIdent: string, callsign: string, groundSpeed: number, track: number, latitude: number, longitude: number, verticalrate: number, squawk: number, altitude: number){
        let currentDate = new Date()
        let day = currentDate.getDate() <= 9 ? '0' + currentDate.getDate() : currentDate.getDate()
        let month = (currentDate.getMonth() + 1) <= 9 ? '0' + (currentDate.getMonth() + 1) : (currentDate.getMonth() + 1)
        let year = currentDate.getFullYear()
        this.hexIdent = hexIdent;
        this.dateMessageGenerated = year + '/' + month + '/' + day;
        this.timeMessageGenerated = currentDate.toTimeString().split(' ')[0];
        this.dateMessageLogged = this.dateMessageGenerated;
        this.timeMessageLogged = this.timeMessageGenerated;
        this.callsign = callsign;
        this.groundSpeed = groundSpeed;
        this.track = track;
        this.latitude = latitude;
        this.longitude = longitude;
        this.verticalrate = verticalrate;
        this.squawk = squawk;
        this.altitude = altitude;
    }

    public generate(){
        const transmissionMessageType = this.onGround ? '2':'3';
        return `${this.messageType},${transmissionMessageType},${this.sessionId},${this.aircraftId},${this.hexIdent},${this.flightId},${this.dateMessageGenerated},${this.timeMessageGenerated}.000,${this.dateMessageLogged},${this.timeMessageLogged}.000,${this.callsign},${this.altitude},${this.groundSpeed},${this.track},${this.latitude},${this.longitude},${this.verticalrate},${this.squawk},${this.squawkHasChanged},${this.emergency},${this.identActive},${this.onGround ? -1 : 0}\n`;
    }
}
