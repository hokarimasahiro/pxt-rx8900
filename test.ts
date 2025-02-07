function timeSend() {
    serial.writeNumbers([
        rtc.getClockData(clockData.year),
        rtc.getClockData(clockData.month),
        rtc.getClockData(clockData.day),
        rtc.getClockData(clockData.weekday),
        rtc.getClockData(clockData.hour),
        rtc.getClockData(clockData.minute),
        rtc.getClockData(clockData.second)
    ])
}
function setClock(cData: string[]) {
    rtc.setClockData(clockData.year, parseFloat(cData[1]))
    rtc.setClockData(clockData.month, parseFloat(cData[2]))
    rtc.setClockData(clockData.day, parseFloat(cData[3]))
    rtc.setClockData(clockData.hour, parseFloat(cData[4]))
    rtc.setClockData(clockData.minute, parseFloat(cData[5]))
    rtc.setClockData(clockData.second, parseFloat(cData[6]))
    rtc.setClock()
}
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    sd = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    if (sd.charAt(0) == "g") {
        rtc.getClock()
        timeSend()
    } else if (sd.charAt(0) == "s") {
        setClock(sd.split(","))
    }
})
let sd = ""
rtc.getClock()
basic.showString("" + rtc.getClockData(clockData.hour) + ":" + rtc.getClockData(clockData.minute))
serial.redirectToUSB()
basic.forever(function () {
    basic.pause(100)
    rtc.getClock()
    if (input.buttonIsPressed(Button.A)) {
        timeSend()
        basic.showString("" + rtc.getClockData(clockData.hour) + ":" + rtc.getClockData(clockData.minute))
    }
})
