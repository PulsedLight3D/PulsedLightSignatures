#include <Servo.h> 
#include <Wire.h>
#include <I2C.h>

#define    LIDARLite_ADDRESS   0x62          // Default I2C Address of LIDAR-Lite.
#define    RegisterMeasure     0x00          // Register to write to initiate ranging.
#define    MeasureValue        0x04          // Value to initiate ranging.
#define    RegisterHighLowB    0x8f          // Register to get both High and Low bytes in 1 call.

 
Servo azimuthServo;  // create servo object to control a servo 
Servo elevationServo; // create servo object to control a servo                 
 
int incrementFlag = 0;
char serialRead;
int pwr_en = 4;
int oldOrNewSensor = 0; // if "1" old sensor, if "2" new sensor
bool runOnce = true;
char *serialValue[32];

bool calibrateMinMaxRange = true;

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
// llWireWrite(0x04,0x02) Turn off return? reference?
// llWireWrite(0x04,0x02) max reference pulse...
 } 
 


void loop() 
{ 
  if(Serial.available() > 0){
     serialInput();
     if ((String)serialValue[0] == "g"){
       oldOrNewSensor = atoi(serialValue[1]);
       Serial.println(oldOrNewSensor);
       runOnce = true;
       serialValue[0] = "a";
    }
  }
  if(oldOrNewSensor == 0 && runOnce == true){
    //Serial.println("Which sensor are we using? Old = 1, New = 2.");
    //Serial.println("azimuth,elevation,radius");
    runOnce = false;
  }else if(oldOrNewSensor != 0 && runOnce == true){
      servoAction(
        atoi(serialValue[2]),
        atoi(serialValue[3]),
        atoi(serialValue[4]),
        atoi(serialValue[5]),      
        atoi(serialValue[6]),
        atoi(serialValue[7]),
        atoi(serialValue[8]),
        atoi(serialValue[9])      
        );
    
  }  
}

int getDistance(int whichSensor){
    int distance = 0;
    if(whichSensor == 1){
     distance = llGetDistance();
    }else if(whichSensor == 2){
      llWireWrite(0x00,0x03); 
      byte myArray[2]; 
      llWireRead(0x8f,2,myArray);
      distance = (myArray[0] << 8) + myArray[1];  
    }
    return distance;  
}

int servoCounter = 0;

void calibrateRange(int azStart, int azEnd, int elStart, int elEnd){
  int minRange = 10000;
  int maxRange = 0;
  int theDistance = 0;
  int azWrite = 0;
  int elWrite = 0;
  for(int i=0;i<11;i++){
    if(i == 0){
      azWrite = azStart;
      elWrite = elStart;
    }else if(i == 1){   
      azWrite = azStart+((azEnd-azStart)/2);
      elWrite = elStart;      
    }else if(i == 2){
      azWrite = azEnd;
      elWrite = elStart;   
    }else if(i == 3){
      azWrite = azStart+((azEnd-azStart)/3);
      elWrite = elStart+((elEnd-elStart)/3);        
    }else if(i == 4){
      azWrite = azStart+(((azEnd-azStart)/3)*2);
      elWrite = elStart+((elEnd-elStart)/3);      
    }else if(i== 5){
      azWrite = azStart+((azEnd-azStart)/2);
      elWrite = elStart+((elEnd-elStart)/2);      
    }else if(i== 6){
      azWrite = azStart+((azEnd-azStart)/3);
      elWrite = elStart+(((elEnd-elStart)/3)*2);      
    }else if(i == 7){
      azWrite = azStart+(((azEnd-azStart)/3)*2);
      elWrite = elStart+(((elEnd-elStart)/3)*2);      
    }else if(i == 8){
      azWrite = azStart;
      elWrite = elEnd;
    }else if(i == 9){
      azWrite = azStart+((azEnd-azStart)/2);
      elWrite = elEnd;      
    }else if(i == 10){
      azWrite = azEnd;
      elWrite = elEnd;               
    }
    azimuthServo.writeMicroseconds(azWrite);
    elevationServo.writeMicroseconds(elWrite);  
    delay(100);
    theDistance = getDistance(oldOrNewSensor);    
    if(theDistance > maxRange){
      maxRange = theDistance;
    }
    if(theDistance < minRange){
      minRange = theDistance;
    }
        
  }
  Serial.print("c");
  Serial.println(minRange);
  Serial.print("C");
  Serial.println(maxRange);
  calibrateMinMaxRange = false;
}


void servoAction(int azSteps, int azStart, int azEnd, int azDelay, int elSteps, int elStart, int elEnd,int elDelay){
   
   int azimuthPosition = azStart;    // variable to store the servo positionition 
   int elevationPosition = elStart; // variable to store the servo positionition 
   int theDistance = 0; // Store the distance value
   
   for(elevationPosition = elStart;elevationPosition <= elEnd; elevationPosition = elevationPosition + elSteps){
    elevationServo.writeMicroseconds(elevationPosition);
    delay(elDelay);
    for(azimuthPosition = azStart;azimuthPosition <= azEnd; azimuthPosition = azimuthPosition + azSteps){
     azimuthServo.writeMicroseconds(azimuthPosition);
     delay(azDelay);
     if(Serial.available() > 0){
        while(Serial.available() > 0){
          serialRead = Serial.read();
          if(serialRead == 10 || serialRead == 32 ){
          }else{
             goto bailout;
          }
        }
      }
      theDistance = getDistance(oldOrNewSensor);
      printValue(azimuthPosition, azStart, elevationPosition, elStart, theDistance, azSteps, elSteps);
    }
  }

  bailout:    
  Serial.println("Finished.........");
  calibrateMinMaxRange = true;
  runOnce = true;
  oldOrNewSensor = 0;
}



void printValue(int az, int azStart, int el, int elStart, int distance, int azSteps, int elSteps){
  Serial.print(az+1000);
  Serial.print(el+1000);
  Serial.print(distance+10000);
  Serial.print(azSteps+100);
  Serial.println(elSteps+100);
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
        nackCatcher = 0;
        goto bailout;
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
      nackCatcher = 0;
       goto bailout;   
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
      runOnce = true;
  oldOrNewSensor = 0;
      }

}

void llReset(){



}

void llWriteAndWait(char myAddress, char myValue){
  uint8_t nackack = 100; // Setup variable to hold ACK/NACK resopnses  
  int nackCount = 0;
  while (nackack != 0){ // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.write(LIDARLite_ADDRESS,myAddress, myValue); // Write to LIDAR-Lite Address with Value
    delay(2); // Wait 2 ms to prevent overpolling
    nackCount++;
    if(nackCount == 100){
        //serialArrayTwo[0][0] = 'a';
        break;
    }else if(nackack == 0){   
    }
  }  
 
}

// Read 1-2 bytes from a register and wait until it responds with sucess
byte llReadAndWait(char myAddress, int numOfBytes, byte arrayToSave[2]){
  uint8_t nackack = 100; // Setup variable to hold ACK/NACK resopnses     
    int nackCount = 0; 
  while (nackack != 0){ // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.read(LIDARLite_ADDRESS,myAddress, numOfBytes, arrayToSave); // Read 1-2 Bytes from LIDAR-Lite Address and store in array
    delay(2); // Wait 2 ms to prevent overpolling
        nackCount++;
    if(nackCount == 100){
        //serialArrayTwo[0][0] = 'a';  
        break;
    }else{
    } 
  }
  //return arrayToSave[2]; // Return array for use in other functions
}


/* ==========================================================================================================================================
Get 2-byte distance from sensor and combine into single 16-bit int
=============================================================================================================================================*/

int llGetDistance(){
  llWriteAndWait(0x00,0x04); // Write 0x04 to register 0x00 to start getting distance readings
  byte myArray[2]; // array to store bytes from read function
  llReadAndWait(0x8f,2,myArray); // Read 2 bytes from 0x8f
  int distance = (myArray[0] << 8) + myArray[1];  // Shift high byte [0] 8 to the left and add low byte [1] to create 16-bit int
  return(distance);
}



void serialInput() {      // Serial input function routine. Declare inData global String, usage input("message string");
  String inData;                    // Global var buffer contain data from serial input function
  char *pch;
  char *serialArray[32];
  int serialCounter = 0;
  char received;                  // Each character received
  while (received != '\n') {      // When new line character is received (\n = LF, \r = CR)
    if (Serial.available() > 0)   // When character in serial buffer read it
    {
      received = Serial.read();
      inData += received;         // Add received character to inData buffer
    }
  }
  inData.trim();                  // Eliminate \n, \r, blank and other not "printable"
  char *inDataChar = new char[inData.length() + 1]; // create a new char * to copy to
  strcpy(inDataChar, inData.c_str()); // Copy the char so to convert from "const char *" to "char *"
  pch = strtok(inDataChar," ,.-");
  serialCounter = 0;
  while (pch != NULL){
    //Serial.println(atoi(pch));
    serialArray[serialCounter] = pch;
    pch = strtok(NULL, " ,.-");
    serialCounter++;
  }
  for(int i=0;i< serialCounter;i++){
    serialValue[i] = serialArray[i];
  }
}
