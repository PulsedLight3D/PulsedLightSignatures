// Sweep
// by BARRAGAN <http://barraganstudio.com> 
// This example code is in the public domain.


#include <Servo.h> 
#include <I2C.h>
#define    LIDARLite_ADDRESS   0x62          // Default I2C Address of LIDAR-Lite.
#define    RegisterMeasure     0x00          // Register to write to initiate ranging.
#define    MeasureValue        0x04          // Value to initiate ranging.
#define    RegisterHighLowB    0x8f          // Register to get both High and Low bytes in 1 call.

 
Servo myservo;  // create servo object to control a servo 
                // a maximum of eight servo objects can be created 
Servo myservo2;                
 
int pos = 0;    // variable to store the servo position 
 
void setup() 
{ 
  myservo.attach(9);  // attaches the servo on pin 9 to the servo object 
  myservo2.attach(10); 
  Serial.begin(115200); //Opens serial connection at 9600bps.     
    I2c.begin(); // Opens & joins the irc bus as master
  delay(100); // Waits to make sure everything is powered up before sending or receiving data  
  I2c.timeOut(50); // Sets a timeout to ensure no locking up of sketch if I2C communication fails

} 
 
int myDistance = 0;
int pos2 = 0;
int incrementFlag = 0;
void loop() 
{ 


    
    for(pos = 1; pos < 90; pos += 1)  // goes from 0 degrees to 180 degrees 
    {                                  // in steps of 1 degree 
      myservo.write(pos);              // tell servo to go to position in variable 'pos' 
      //myservo2.write(pos);
                getDistance();
//      delay(15);                       // waits 15ms for the servo to reach the position 
      Serial.print(pos);
    Serial.print(",");
    Serial.print(pos2);
    Serial.print(",");
    Serial.println(myDistance);
    } 
    
    myservo2.write(pos2);
    if(incrementFlag == 0){
      pos2++;
    }else{
      pos2 = pos2-1;
    }
    
    for(pos = 90; pos>=1; pos-=1)     // goes from 180 degrees to 0 degrees 
    {                                
      myservo.write(pos);              // tell servo to go to position in variable 'pos' 
      //myservo2.write(pos);
          getDistance();
//      delay(15);                       // waits 15ms for the servo to reach the position 

    Serial.print(pos);
    Serial.print(",");
    Serial.print(pos2);
    Serial.print(",");
    Serial.println(myDistance);

    }
    
    if(pos2 == 90){
         incrementFlag = 1;   
    }else if(pos2 == 1){
      incrementFlag = 0;
    }
    myservo2.write(pos2);
    if(incrementFlag == 0){
      pos2++;
    }else{
      pos2 = pos2 -1;
    }
  
}

void getDistance(){
 // Write 0x04 to register 0x00
  uint8_t nackack = 100; // Setup variable to hold ACK/NACK resopnses     
  while (nackack != 0){ // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.write(LIDARLite_ADDRESS,RegisterMeasure, MeasureValue); // Write 0x04 to 0x00
    delay(1); // Wait 1 ms to prevent overpolling
  }

  byte distanceArray[2]; // array to store distance bytes from read function
  
  // Read 2byte distance from register 0x8f
  nackack = 100; // Setup variable to hold ACK/NACK resopnses     
  while (nackack != 0){ // While NACK keep going (i.e. continue polling until sucess message (ACK) is received )
    nackack = I2c.read(LIDARLite_ADDRESS,RegisterHighLowB, 2, distanceArray); // Read 2 Bytes from LIDAR-Lite Address and store in array
    delay(1); // Wait 1 ms to prevent overpolling
  }
  int distance = (distanceArray[0] << 8) + distanceArray[1];  // Shift high byte [0] 8 to the left and add low byte [1] to create 16-bit int
  
  // Print Distance
  myDistance = distance;
}
