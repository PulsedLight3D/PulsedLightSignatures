#include <Wire.h>

#include <LIDARLite.h>

/* =============================================================================
  LIDAR-Lite v2: Change the I2C address of multiple sensors with PWR_EN line

  This example demonstrates how to chage the i2c address of multiple sensors.

  The library is in BETA, so subscribe to the github repo to recieve updates, or
  just check in periodically:
  https://github.com/PulsedLight3D/LIDARLite_v2_Arduino_Library

  To learn more read over lidarlite.cpp as each function is commented
=========================================================================== */




int sensorPins[] = {1,2,3,4,5,6,7,8,9}; // Array of pins connected to the sensor Power Enable lines
unsigned char addresses[] = {0x40,0x42,0x44,0x46,0x48,0x50,0x52,0x54,0x56};

LIDARLite myLidarLite;

void setup() {
  Serial.begin(115200);
  myLidarLite.begin(true,1);
  myLidarLite.changeAddressMultiPwrEn(9,sensorPins,addresses,false);
  delay(100);
  Serial.println("Addresses!");
}

int getDistanceAndCheck(unsigned char thisAddress){
    int tempResult = myLidarLite.distance(true, true, thisAddress);
      tempResult = (tempResult + 1000);
        if (tempResult > 9999 || tempResult < 0){
        tempResult = 0;
    }
    return tempResult;
}

void loop() {
  Serial.println("Did this");
  for (int i=0; i<8; i++){
    Serial.println("Did this 2");
    Serial.print(getDistanceAndCheck(addresses[i]));
  }
  Serial.println("Did this 3");  
  Serial.println(getDistanceAndCheck(addresses[8]));
}
