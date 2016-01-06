#include <Servo.h> 
#include <Wire.h>
#define    LIDARLite_ADDRESS   0x62          // Default I2C Address of LIDAR-Lite.
#define    RegisterMeasure     0x00          // Register to write to initiate ranging.
#define    MeasureValue        0x04          // Value to initiate ranging.
#define    RegisterHighLowB    0x8f          // Register to get both High and Low bytes in 1 call.

 
Servo azimuthServo;  // create servo object to control a servo 
Servo elevationServo; // create servo object to control a servo                 
 
int azimuthPosition = 800;    // variable to store the servo positionition 
int elevationPosition = 800; // variable to store the servo positionition 
float theDistance = 0; // Store the distance value
int incrementFlag = 0;
int pwr_en = 4;
char oldOrNewSensor = '0'; // if "1" old sensor, if "2" new sensor
char serialRead;
bool runOnce = true;

void setup() 
{ 
  azimuthServo.attach(9);  // attaches the servo on pin 9 to the servo object 
  elevationServo.attach(10); // attaches the servo on pin 10 to the servo object 
 Wire.begin(); // join i2c bus
  TWBR = ((F_CPU / 400000l) - 16) / 2;
  Serial.begin(115200); 
  llWireWrite(0x00,0x00);
  delay(30);
//  llWireWrite(0x02,0x10);
//  delay(30);
//  llWireWrite(0x12,0x05); 
//   delay(30);
//   llWireWrite(0x03,0x31); 
//   delay(30);
 } 
 


void loop() 
{ 
  if(Serial.available() > 0){
    while(Serial.available() > 0){
      serialRead = Serial.read();
      if(serialRead == 10 || serialRead == 32 ){
      }else{
         oldOrNewSensor = serialRead;
         runOnce = true;
      }
    }
  }
  if(oldOrNewSensor == '0' && runOnce == true){
    Serial.println("Which sensor are we using? Old = 1, New = 2.");
    Serial.println("azimuth,elevation,radius");
    runOnce = false;
  }else if(oldOrNewSensor != '0' && runOnce == true){
    servoAction(1200,2100,600,1000);
  
    runOnce = false;
  }  
}

void getDistance(char whichSensor){
    if(whichSensor == '1'){
     
    }else if(whichSensor == '2'){
      llWireWrite(0x00,0x03); 
      byte myArray[2]; 
      llWireRead(0x8f,2,myArray);
       int distance = (myArray[0] << 8) + myArray[1];  
      theDistance = distance;
    }
  theDistance = theDistance;
  
}

int servoCounter = 0;

void servoAction(int azStart, int azEnd, int elStart, int elEnd){
   for(elevationPosition = elStart; elevationPosition < elEnd; elevationPosition += 1){
    elevationServo.writeMicroseconds(elevationPosition);
//    servoCounter++;
//    if(servoCounter > 9){
//      digitalWrite(pwr_en, HIGH);
//      delay(20);
//        digitalWrite(pwr_en, LOW);
//        delay(30);
//              Wire.endTransmission(true);
//        servoCounter = 0;
//    }
    for(azimuthPosition = azStart; azimuthPosition < azEnd; azimuthPosition += 1){                                  
     azimuthServo.writeMicroseconds(azimuthPosition);              // tell servo to go to azimuthPositionition in variable 'azimuthPosition' 
      //llWireWrite(0x00,0x00);
      //Wire.endTransmission(true);
//      delayMicroseconds(100);
      getDistance(oldOrNewSensor);
      //theDistance = 1.23;
      printValue(azimuthPosition, azStart, elevationPosition, elStart, theDistance);
    } 
  }
  Serial.println("Finished.........");
}



void printValue(int az, int azStart, int el, int elStart, float distance){
  Serial.print(az - azStart+1);
  Serial.print(",");
  Serial.print(el - elStart+1);
  Serial.print(",");
  Serial.println(distance);
}


void llWireWrite(char myAddress, char myValue){
  // write myValue to myAddress
  Wire.beginTransmission((int)LIDARLite_ADDRESS); 
  Wire.write((int)myAddress); 
  Wire.write((int)myValue); 
  Wire.endTransmission();                  
  delayMicroseconds(800);
}



// Read 1-2 bytes from a register and wait until it responds with sucess
//int imBusyCounter = 0;
//void llWireRead(char myAddress, int numOfBytes, byte arrayToSave[2]){
//  int imBusy = 1;
//        imBusyCounter = 0;
//  while(imBusy != 0){
//    Wire.beginTransmission((int)LIDARLite_ADDRESS);    
//    Wire.write(0x01);                               
//    Wire.endTransmission(); 
//    Wire.requestFrom((int)LIDARLite_ADDRESS,1); 
//    imBusy = bitRead(Wire.read(),0);        // read that byte into 'slaveByte2' variable
//    imBusyCounter++;
//    if(imBusyCounter > 100){
//      Serial.println("BUSY!");
//      imBusyCounter = 0;
//    }
//  }
//  if(imBusy == 0){
//    imBusyCounter = 0;
//    //arrayToSave becomes the value of the read, for each numOfBytes...
//    Wire.beginTransmission((int)LIDARLite_ADDRESS); // transmit to LIDAR-Lite
//    Wire.write((int)myAddress); // sets register pointer to (0x8f)
//    int nackCatcher = Wire.endTransmission();                 
//    Wire.requestFrom((int)LIDARLite_ADDRESS, numOfBytes); 
//    if(numOfBytes <= Wire.available()){
//      for(int i = 0;i < numOfBytes;i++){
//        arrayToSave[i] = Wire.read(); 
//      }
//    }
//  }
//}


void llWireRead(char myAddress, int numOfBytes, byte arrayToSave[2]){
  int imBusy = 1;
  int busyResetCounter = 0;
  int imStuck = 0;
  while(imBusy != 0){
    Wire.beginTransmission((int)LIDARLite_ADDRESS);    // Get the slave's attention, tell it we're sending a command byte
    Wire.write(0x01);                               //  The command byte, sets pointer to register with address of 0x32
    int nackCatcher = Wire.endTransmission();                  // "Hang up the line" so others can use it (can have multiple slaves & masters connected)
    if(nackCatcher != 0){
      Serial.println("N^K");
    }
    Wire.requestFrom((int)LIDARLite_ADDRESS,1);          // Tell slave we need to read 1byte from the current register

    imStuck++;
    if(imStuck > 100){
     Serial.println("PostReqest from 0x01");
     goto bailout;
    }
    //
    // THIS BUSY IS PROBSABLY where the error is
    // ... NACK would lock this up!
    //

    imBusy = bitRead(Wire.read(),0);        // read that byte into 'slaveByte2' variable
    busyResetCounter++;
    if(busyResetCounter > 99){
      Serial.println("BusyCounter > 99");
      unsigned char errorCode[] = {0x00};
      Wire.beginTransmission((int)LIDARLite_ADDRESS);    // Get the slave's attention, tell it we're sending a command byte
      Wire.write(0x40);
      delay(20);
      int nackCatcher = Wire.endTransmission();                  // "Hang up the line" so others can use it (can have multiple slaves & masters connected)
      if(nackCatcher != 0){
        Serial.println("N^K");
      }
      Wire.requestFrom((int)LIDARLite_ADDRESS,1);
      errorCode[0] = Wire.read();
      delay(10);
      Serial.print("!");
      //Serial.print((serialNumber[0] << 8) + serialNumber[1]);
      Serial.print("!");
      Serial.println(errorCode[0]);
      Serial.end();
      delay(20);
      Serial.begin(115200); //Opens serial connection
      digitalWrite(pwr_en, HIGH);
      Serial.println("ready");
      //serialArrayTwo[0][0] = 'r';
      goto bailout;
    }
  }
  if(imBusy == 0){
    //arrayToSave becomes the value of the read, for each numOfBytes...
    Wire.beginTransmission((int)LIDARLite_ADDRESS); // transmit to LIDAR-Lite
    Wire.write((int)myAddress); // sets register pointer to (0x8f)
    int nackCatcher = Wire.endTransmission();                  // "Hang up the line" so others can use it (can have multiple slaves & masters connected)
    if(nackCatcher != 0){
      Serial.println("N^K");
    }
    Wire.requestFrom((int)LIDARLite_ADDRESS, numOfBytes); // request 2 bytes from LIDAR-Lite
    int i = 0;
    if(numOfBytes <= Wire.available()) // if two bytes were received
    {
      while(i < numOfBytes){
        arrayToSave[i] = Wire.read(); // receive high byte (overwrites previous reading)
        i++;
      }
    }
  }
      if(busyResetCounter > 99){
    bailout:     Serial.println("bailout!");
      }

}

void llReset(){



}
