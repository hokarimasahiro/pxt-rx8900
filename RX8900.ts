/**
 * makecode RTC(RX8900) Package.
 */
enum clockData {
    //% block.loc.ja="年"
    year = 0,    // 1970～2069
    //% block.loc.ja="月"
    month = 1,
    //% block.loc.ja="日"
    day = 2,
    //% block.loc.ja="曜日"
    weekday = 3,  // 0:日曜日～6:土曜日
    //% block.loc.ja="時"
    hour = 4,
    //% block.loc.ja="分"
    minute = 5,
    //% block.loc.ja="秒"
    second = 6,
    //% block="UNIX TIME"
    unix = 7
}

/**
 * RTC block
 */
//% weight=10 color=#800080 icon="\uf017" block="RX8900"
namespace rtc {

    let I2C_ADDR = 0x32;
    let REG_CTRL = 0x0f;
    let REG_SECOND = 0x00;
    let REG_ALARM = 0x08;
    let REG_STATUS = 0x0e;
    let dateTime = [0, 0, 0, 0, 0, 0, 0];     // year,month,day,weekday,hour,minute,second
    let initFlag = 0;
    /**
     * set reg
     */
    function setReg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(I2C_ADDR, buf);
    }

    /**
     * get reg
     */
    function getReg(reg: number): number {
        pins.i2cWriteNumber(I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt8BE);
    }

    /**
     * convert a BCD data to Dec
     */
    function HexToDec(dat: number): number {
        return (dat >> 4) * 10 + (dat & 0x0f);
    }

    /**
     * convert a Dec data to BCD
     */
    function DecToHex(dat: number): number {
        return Math.trunc(dat / 10) << 4 | (dat % 10)
    }

    /**
     * init device
     */
    //% blockId="initDevice" block="init device"
    export function initDevice(): void {

        if (initFlag == 0) {
            setReg(REG_CTRL, 0x00)
            initFlag = 1;
        }
    }
    /**
     * set clock
     */
    //% blockId="setClock" block="set clock"
    export function setClock(): void {

        let buf = pins.createBuffer(8);

        buf[0] = REG_SECOND;
        buf[1] = DecToHex(dateTime[clockData.second]);
        buf[2] = DecToHex(dateTime[clockData.minute]);
        buf[3] = DecToHex(dateTime[clockData.hour]);
        buf[4] = 0x01 << getWeekday(convDateTime(
            dateTime[clockData.year],
            dateTime[clockData.month],
            dateTime[clockData.day],
            dateTime[clockData.hour],
            dateTime[clockData.minute],
            dateTime[clockData.second]
        ));
        buf[5] = DecToHex(dateTime[clockData.day]);
        buf[6] = DecToHex(dateTime[clockData.month]);
        buf[7] = DecToHex(dateTime[clockData.year] % 100);

        pins.i2cWriteBuffer(I2C_ADDR, buf)
    }
    /**
     * get clock
     */
    //% blockId="getClock" block="get clock"
    export function getClock(): void {

        pins.i2cWriteNumber(I2C_ADDR, REG_SECOND, NumberFormat.UInt8BE);
        let buf = pins.i2cReadBuffer(I2C_ADDR, 8);

        if (HexToDec(buf[6]) < 70) {
            dateTime[clockData.year] = HexToDec(buf[6]) + 2000;
        } else {
            dateTime[clockData.year] = HexToDec(buf[6]) + 1900;
        }      // year
        dateTime[clockData.month] = HexToDec(buf[5] & 0x1f)    	// month
        dateTime[clockData.day] = HexToDec(buf[4] & 0x3f)       // day
        for(let w=0;w<7;w++){
            if ((buf[3] >> w) == 0x01){
                dateTime[clockData.weekday]=w;                      // weekday
            }
        }
        dateTime[clockData.hour] = HexToDec(buf[2] & 0x3f)     	// hour
        dateTime[clockData.minute] = HexToDec(buf[1] & 0x7f)   	// minute
        dateTime[clockData.second] = HexToDec(buf[0] & 0x7f)   	// second
    }
    /**
     * setAlarm
     * @param n alarm number
     * @param h hour
     * @param m minute
     */
    //% blockId="setAlarm" block="set alarm#%n to %h:%m"
    export function setAlarm(n: number, h: number, m: number): void {
        let buf = pins.createBuffer(4);

        buf[0] = REG_ALARM;
        buf[1] = DecToHex(m);
        buf[2] = DecToHex(h);
        buf[3] = 0x80;

        pins.i2cWriteBuffer(I2C_ADDR, buf);
    }
    /**
     * resetAlarm
     * @param n alarm number
     */
    //% blockId="resetAlarm" block="reset alarm#%n"
    export function resetAlarm(n: number): void {
        let buf = pins.createBuffer(4);

        buf[0] = REG_ALARM;
        buf[1] = 0x80;
        buf[2] = 0x80;
        buf[3] = 0x80;

        pins.i2cWriteBuffer(I2C_ADDR, buf);
    }
    /**
     * checkAlarm
     * @param n alarm number
     */
    //% blockId="checkAlarm" block="check alarm#%n"
    export function checkAlarm(n: number): boolean {
        let ct = getReg(REG_STATUS);
        if ((ct & 0x40) != 0x00) return true;
        else return false;
    }
    /**
     * setClockData
     * @param dt clockData
     * @param n data, eg:8
     */
    //% blockId="setClockData" block="set %clockData to %n"
    export function setClockData(dt: clockData, n: number): void {
        if (dt != clockData.unix) dateTime[dt] = n;
        else {
            dateTime[clockData.year] = getYear(n);
            dateTime[clockData.month] = getMonth(n);
            dateTime[clockData.day] = getDay(n);
            dateTime[clockData.weekday] = getWeekday(n);
            dateTime[clockData.hour] = getHour(n);
            dateTime[clockData.minute] = getMinute(n);
            dateTime[clockData.second] = getSecond(n);
        }
    }

    /**
     * getClockData
     * @param dt clockData
     */
    //% block="$dt"
    export function getClockData(dt: clockData): number {
        if (dt != clockData.unix) return dateTime[dt];
        else {
            return convDateTime(dateTime[clockData.year],
                dateTime[clockData.month],
                dateTime[clockData.day],
                dateTime[clockData.hour],
                dateTime[clockData.minute],
                dateTime[clockData.second]
            );
        }
    }
    let wYear: number;
    let wDays: number;
    let leapYear: number;
    function getHour(DateTime: number): number {
        return Math.trunc(DateTime / 3600) % 24
    }
    function getMinute(DateTime: number): number {
        return Math.trunc(DateTime / 60) % 60
    }
    function getSecond(DateTime: number): number {
        return DateTime % 60
    }
    function getDays(DateTime: number): number {
        return Math.trunc(DateTime / 86400)
    }
    function getYear(Datetime: number): number {
        wYear = Math.trunc((getDays(Datetime) + 0.5) / 365.25)
        return wYear + 1970
    }
    function getMonth(Datetime: number): number {
        wYear = getYear(Datetime)
        wDays = getDays(Datetime) - ((wYear - 1970) * 365 + Math.ceil((wYear - 1972) / 4))
        if (wYear % 4 == 0) {
            leapYear = 1
        } else {
            leapYear = 0
        }
        if (wDays > 333 + leapYear) {
            return 12
        } else if (wDays > 303 + leapYear) {
            return 11
        } else if (wDays > 272 + leapYear) {
            return 10
        } else if (wDays > 242 + leapYear) {
            return 9
        } else if (wDays > 211 + leapYear) {
            return 8
        } else if (wDays > 180 + leapYear) {
            return 7
        } else if (wDays > 150 + leapYear) {
            return 6
        } else if (wDays > 119 + leapYear) {
            return 5
        } else if (wDays > 89 + leapYear) {
            return 4
        } else if (wDays > 58 + leapYear) {
            return 3
        } else if (wDays > 30 + 0) {
            return 2
        } else {
            return 1
        }
    }
    function getDay(Datetime: number): number {
        wYear = getYear(Datetime)
        wDays = getDays(Datetime) - ((wYear - 1970) * 365 + Math.ceil((wYear - 1972) / 4))
        if (wYear % 4 == 0) {
            leapYear = 1
        } else {
            leapYear = 0
        }
        if (wDays > 333 + leapYear) {
            return wDays - (333 + leapYear)
        } else if (wDays > 303 + leapYear) {
            return wDays - (303 + leapYear)
        } else if (wDays > 272 + leapYear) {
            return wDays - (272 + leapYear)
        } else if (wDays > 242 + leapYear) {
            return wDays - (242 + leapYear)
        } else if (wDays > 211 + leapYear) {
            return wDays - (211 + leapYear)
        } else if (wDays > 180 + leapYear) {
            return wDays - (180 + leapYear)
        } else if (wDays > 150 + leapYear) {
            return wDays - (150 + leapYear)
        } else if (wDays > 119 + leapYear) {
            return wDays - (119 + leapYear)
        } else if (wDays > 89 + leapYear) {
            return wDays - (89 + leapYear)
        } else if (wDays > 58 + leapYear) {
            return wDays - (58 + leapYear)
        } else if (wDays > 30 + 0) {
            return wDays - (30 + 0)
        } else {
            return wDays + 1
        }
    }
    function getWeekday(DateTime: number): number {
        return (getDays(DateTime) + 4) % 7
    }
    function convDateTime(year: number, month: number, day: number, hour: number, minute: number, second: number): number {
        if (year < 100) wYear = (2000 + year) - 1970; else wYear = year - 1970;
        if (year % 4 == 0) {
            leapYear = 1
        } else {
            leapYear = 0
        }
        wDays = wYear * 365 + Math.ceil((wYear - 2) / 4)
        if (month == 1) {
            wDays += day - 1
        } else if (month == 2) {
            wDays += day + 30 + 0
        } else if (month == 3) {
            wDays += day + 58 + leapYear
        } else if (month == 4) {
            wDays += day + 89 + leapYear
        } else if (month == 5) {
            wDays += day + 119 + leapYear
        } else if (month == 6) {
            wDays += day + 150 + leapYear
        } else if (month == 7) {
            wDays += day + 180 + leapYear
        } else if (month == 8) {
            wDays += day + 211 + leapYear
        } else if (month == 9) {
            wDays += day + 242 + leapYear
        } else if (month == 10) {
            wDays += day + 272 + leapYear
        } else if (month == 11) {
            wDays += day + 303 + leapYear
        } else if (month == 12) {
            wDays += day + 333 + leapYear
        }
        return ((wDays * 24 + hour) * 60 + minute) * 60 + second
    }
}
