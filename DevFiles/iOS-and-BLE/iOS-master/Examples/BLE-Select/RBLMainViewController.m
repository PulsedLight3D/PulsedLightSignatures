//
//  RBLMainViewController.m
//  BLE Select
//
//  Created by Chi-Hung Ma on 4/24/13.
//  Copyright (c) 2013 RedBearlab. All rights reserved.
//

#import "RBLMainViewController.h"
#import "RBLDetailViewController.h"
#import <CoreMotion/CoreMotion.h>
#import <CoreLocation/CoreLocation.h>
#import <MessageUI/MessageUI.h>

@interface RBLMainViewController ()
 
@property (weak, nonatomic) IBOutlet UIBarButtonItem *scanButton;
@property (weak, nonatomic) IBOutlet UIButton *recordButton;
@property (weak, nonatomic) IBOutlet UIButton *emailButton;


- (IBAction)scanClick:(id)sender;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *lastButton;

- (IBAction)lastClick:(id)sender;
@property (weak, nonatomic) IBOutlet UITextField *locLong;
@property (weak, nonatomic) IBOutlet UITextField *locLat;

@property (weak, nonatomic) IBOutlet UITextField *accelX;
@property (weak, nonatomic) IBOutlet UITextField *accelY;
@property (weak, nonatomic) IBOutlet UITextField *accelZ;


@property (weak, nonatomic) IBOutlet UITextField *rotX;
@property (weak, nonatomic) IBOutlet UITextField *rotY;
@property (weak, nonatomic) IBOutlet UITextField *rotZ;

@property (weak, nonatomic) IBOutlet UITextField *s1;
@property (weak, nonatomic) IBOutlet UITextField *s2;
@property (weak, nonatomic) IBOutlet UITextField *s3;
@property (weak, nonatomic) IBOutlet UITextField *s4;
@property (weak, nonatomic) IBOutlet UITextField *s5;
@property (weak, nonatomic) IBOutlet UITextField *s6;
@property (weak, nonatomic) IBOutlet UITextField *s7;
@property (weak, nonatomic) IBOutlet UITextField *s8;
@property (weak, nonatomic) IBOutlet UITextField *s9;


@property (weak, nonatomic) IBOutlet UILabel *uuidLabel;
@property (weak, nonatomic) IBOutlet UILabel *rssiLabel;
@property (weak, nonatomic) IBOutlet UITextView *serialData;

@property (weak, nonatomic) IBOutlet UIActivityIndicatorView *spinner;
@property (weak, nonatomic) IBOutlet UIView *curtain;
@property (strong, nonatomic) CMMotionManager *motionManager;

@property (nonatomic, strong) NSString *documentsDirectory;

@property (nonatomic, strong) NSString *theFilename;

@property(nonatomic,assign) id <MFMailComposeViewControllerDelegate> mailComposeDelegate;

@end

double currentMaxAccelX;
double currentMaxAccelY;
double currentMaxAccelZ;
double currentMaxRotX;
double currentMaxRotY;
double currentMaxRotZ;

double currentAccelX;
double currentAccelY;
double currentAccelZ;

double currentRotX;
double currentRotY;
double currentRotZ;

double currentLat;
double currentLong;

NSString * const  UUIDPrefKey = @"UUIDPrefKey";

@implementation RBLMainViewController

// Tutorial: http://nevan.net/2014/09/core-location-manager-changes-in-ios-8/
// Location Manager Delegate Methods
- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations
{
//    NSLog(@"%@", [locations lastObject]);
    
    currentLong = self.locationManager.location.coordinate.longitude;
    currentLat = self.locationManager.location.coordinate.latitude;
    
    self.locLong.text = [NSString stringWithFormat:@"%f", currentLong];
    self.locLat.text = [NSString stringWithFormat:@"%f", currentLat];
}
bool saveFile = false;
- (IBAction)recordStop:(id)sender {
    if(!saveFile){
        [self.recordButton setTitle:@"Stop Recording" forState: normal];
        saveFile = true;
        // Set the documents directory path to the documentsDirectory property.
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        self.documentsDirectory = [paths objectAtIndex:0];
        
        // Keep the database filename.
        self.theFilename = @"data.txt";
        
        // Copy the database file into the documents directory if necessary.
        
        [self copyFileIntoDocumentsDirectory];
        
        
       
       
//        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  //      NSString *documentsDirectory = [paths objectAtIndex:0];
//        NSString *appFile = [documentsDirectory stringByAppendingPathComponent:@"MyFile"];
//        [data writeToFile:appFile atomically:YES];
        
//        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths objectAtIndex:0];
        NSString *documentTXTPath = [documentsDirectory stringByAppendingPathComponent:@"data.txt"];
        NSString *savedString = @"time,aX,aY,aZ,rX,rY,rZ,lat,lon\n";
       // NSFileHandle *myHandle = [NSFileHandle fileHandleForUpdatingAtPath:documentTXTPath];
//        [myHandle writeData:[savedString dataUsingEncoding:NSUTF8StringEncoding]];
        [[savedString dataUsingEncoding:NSUTF8StringEncoding] writeToFile:documentTXTPath atomically:YES];
        
        [self.motionManager startAccelerometerUpdatesToQueue:[NSOperationQueue currentQueue]
                                                 withHandler:^(CMAccelerometerData  *accelerometerData, NSError *error) {
                                                     [self outputAccelertionData:accelerometerData.acceleration];
                                                     if(error){
                                                         
                                                         NSLog(@"%@", error);
                                                     }
                                                 }];
        
        [self.motionManager startGyroUpdatesToQueue:[NSOperationQueue currentQueue]
                                        withHandler:^(CMGyroData *gyroData, NSError *error) {
                                            [self outputRotationData:gyroData.rotationRate];
                                        }];
        
        
    }else{
        [self.recordButton setTitle:@"Start Recording" forState:normal ];
        saveFile = false;
        
        [self.motionManager stopAccelerometerUpdates];
        [self.motionManager  stopGyroUpdates];
    }
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];

    
    
    
    
        self.spinner.hidden = true;
    
    
    
    
    
    
    // ** Don't forget to add NSLocationWhenInUseUsageDescription in MyApp-Info.plist and give it a string
    
    self.locationManager = [[CLLocationManager alloc] init];
    self.locationManager.delegate = self;
    // Check for iOS 8. Without this guard the code will crash with "unknown selector" on iOS 7.
    if ([self.locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
        [self.locationManager requestWhenInUseAuthorization];
    }
    [self.locationManager startUpdatingLocation];

    currentMaxAccelX = 0;
    currentMaxAccelY = 0;
    currentMaxAccelZ = 0;
    
    currentMaxRotX = 0;
    currentMaxRotY = 0;
    currentMaxRotZ = 0;
    
    self.motionManager = [[CMMotionManager alloc] init];
    self.motionManager.accelerometerUpdateInterval = .01;
    self.motionManager.gyroUpdateInterval = .01;
    
   

    
    
    myOldText = [NSMutableString stringWithString: @"This is a string"];
	// Do any additional setup after loading the view.
    
    bleShield = [[BLE alloc] init];
    [bleShield controlSetup];
    bleShield.delegate = self;
    
    //Retrieve saved UUID from system
    self.lastUUID = [[NSUserDefaults standardUserDefaults] objectForKey:UUIDPrefKey];
    
    if (self.lastUUID.length > 0)
    {
        self.uuidLabel.text = self.lastUUID;
    }
    else
    {
        self.lastButton.enabled = false;
    }
    
    self.mDevices = [[NSMutableArray alloc] init];

}


-(instancetype)initWithFilename:(NSString *)myFilename{
    self = [super init];
    if (self) {
        // Set the documents directory path to the documentsDirectory property.
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        self.documentsDirectory = [paths objectAtIndex:0];
        
        // Keep the database filename.
        self.theFilename = myFilename;
        
        // Copy the database file into the documents directory if necessary.
        [self copyFileIntoDocumentsDirectory];
    }
    return self;
}


#pragma mark - Private method implementation

-(void)copyFileIntoDocumentsDirectory{
    // Check if the database file exists in the documents directory.
    NSString *destinationPath = [self.documentsDirectory stringByAppendingPathComponent:self.theFilename];
    if (![[NSFileManager defaultManager] fileExistsAtPath:destinationPath]) {
        // The database file does not exist in the documents directory, so copy it from the main bundle now.
        NSString *sourcePath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:self.theFilename];
        NSError *error;
        [[NSFileManager defaultManager] copyItemAtPath:sourcePath toPath:destinationPath error:&error];
        
        // Check if any error occurred during copying and display it.
        if (error != nil) {
            NSLog(@"%@", [error localizedDescription]);
        }
    }
}

-(NSString *)applicationDocumentsDirectory {
    
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *basePath = ([paths count] > 0) ? [paths objectAtIndex:0] : nil;
    return basePath;
    
}

- (IBAction)mailSql:(id)sender {
    NSLog(@"WOO");
    NSString *filePath = [[self applicationDocumentsDirectory] stringByAppendingPathComponent:@"data.txt"];
    
    
    if ([MFMailComposeViewController canSendMail]){
        MFMailComposeViewController *mailController = [[MFMailComposeViewController alloc] init];
        mailController.mailComposeDelegate = self;
        [mailController setSubject:@"Some Subject"];
        [mailController addAttachmentData:[NSData dataWithContentsOfFile:filePath]
                                 mimeType:@"application/sql"
                                 fileName:filePath];
        
        [self presentViewController:mailController animated:YES completion:NULL];
    }else{
        NSLog(@"This device cannot send email");
    }
    
    
}

-(void)mailComposeController:(MFMailComposeViewController *)controller didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error{
    if (error){
      //  NSString *errorTitle = @"Mail Error";
       // NSString *errorDescription = [error localizedDescription];
        //UIAlertView *errorView = [[UIAlertView alloc]initWithTitle:errorTitle message:errorDescription delegate:self cancelButtonTitle:nil otherButtonTitles:@"OK", nil];
//        [errorView show];
    }
    [controller dismissViewControllerAnimated:YES completion:NULL];
    
}

-(void)outputAccelertionData:(CMAcceleration)acceleration
{
    
// FROM: http://nscookbook.com/2013/03/ios-programming-recipe-19-using-core-motion-to-access-gyro-and-accelerometer/
    
//    self.accX.text = [NSString stringWithFormat:@" %.2fg",acceleration.x];
    if(fabs(acceleration.x) > fabs(currentMaxAccelX))
    {
        currentMaxAccelX = acceleration.x;
    }
//    self.accY.text = [NSString stringWithFormat:@" %.2fg",acceleration.y];
    if(fabs(acceleration.y) > fabs(currentMaxAccelY))
    {
        currentMaxAccelY = acceleration.y;
    }
//    self.accZ.text = [NSString stringWithFormat:@" %.2fg",acceleration.z];
    if(fabs(acceleration.z) > fabs(currentMaxAccelZ))
    {
        currentMaxAccelZ = acceleration.z;
    }
    
//    self.maxAccX.text = [NSString stringWithFormat:@" %.2f",currentMaxAccelX];
//    self.maxAccY.text = [NSString stringWithFormat:@" %.2f",currentMaxAccelY];
//    self.maxAccZ.text = [NSString stringWithFormat:@" %.2f",currentMaxAccelZ];
    currentAccelX = acceleration.x;
    currentAccelY = acceleration.y;
    currentAccelZ = acceleration.z;
    
    self.accelX.text = [NSString stringWithFormat: @"%f", currentAccelX];
    self.accelY.text = [NSString stringWithFormat: @"%f", currentAccelY];
    self.accelZ.text = [NSString stringWithFormat: @"%f", currentAccelZ];
//    NSLog(@"X: %f, Y: %f, Z: %f", acceleration.x, acceleration.y, acceleration.z);
    
}

NSDate *start;
NSString *printString;
-(void)outputRotationData:(CMRotationRate)rotation
{
    
//    self.rotX.text = [NSString stringWithFormat:@" %.2fr/s",rotation.x];
    if(fabs(rotation.x) > fabs(currentMaxRotX))
    {
        currentMaxRotX = rotation.x;
    }
//    self.rotY.text = [NSString stringWithFormat:@" %.2fr/s",rotation.y];
    if(fabs(rotation.y) > fabs(currentMaxRotY))
    {
        currentMaxRotY = rotation.y;
    }
//    self.rotZ.text = [NSString stringWithFormat:@" %.2fr/s",rotation.z];
    if(fabs(rotation.z) > fabs(currentMaxRotZ))
    {
        currentMaxRotZ = rotation.z;
    }
    
//    self.maxRotX.text = [NSString stringWithFormat:@" %.2f",currentMaxRotX];
//    self.maxRotY.text = [NSString stringWithFormat:@" %.2f",currentMaxRotY];
//    self.maxRotZ.text = [NSString stringWithFormat:@" %.2f",currentMaxRotZ];
    
    currentRotX = rotation.x;
    currentRotY = rotation.y;
    currentRotZ = rotation.z;
    
    self.rotX.text = [NSString stringWithFormat: @"%f", currentRotX];
    self.rotY.text = [NSString stringWithFormat: @"%f", currentRotY];
    self.rotZ.text = [NSString stringWithFormat: @"%f", currentRotZ];
//    NSLog(@"rotX: %f, rotY: %f, rotZ: %f", rotation.x, rotation.y, rotation.z);
    
    if(saveFile){
        start = [NSDate date];
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths objectAtIndex:0];
        NSString *documentTXTPath = [documentsDirectory stringByAppendingPathComponent:@"data.txt"];
        NSString *savedString = [NSString stringWithFormat: @"%@,%f,%f,%f,%f,%f,%f,%f,%f\n", start,currentAccelX,currentAccelY,currentAccelZ,currentRotX, currentMaxRotY,currentMaxRotZ, currentLat,currentLong];
        NSFileHandle *myHandle = [NSFileHandle fileHandleForWritingAtPath:documentTXTPath];
        [myHandle seekToEndOfFile];
        [myHandle writeData:[savedString dataUsingEncoding:NSUTF8StringEncoding]];
    }
    
}



- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


- (IBAction)scanClick:(id)sender {

    if (bleShield.activePeripheral)
    {
   //     if(bleShield.activePeripheral.isConnected)
        if(bleShield.activePeripheral.state == CBPeripheralStateConnected)
        {
            [[bleShield CM] cancelPeripheralConnection:[bleShield activePeripheral]];
            return;
        }
    }
    
    if (bleShield.peripherals)
        bleShield.peripherals = nil;
    
    [bleShield findBLEPeripherals:3];
    
    [NSTimer scheduledTimerWithTimeInterval:(float)3.0 target:self selector:@selector(connectionTimer:) userInfo:nil repeats:NO];

    
    isFindingLast = false;
    self.lastButton.enabled = false;
    self.scanButton.enabled = false;
    self.curtain.hidden = false;
    self.spinner.hidden = false;
    [self.spinner startAnimating];
    
}


- (IBAction)lastClick:(id)sender {
    
    [bleShield findBLEPeripherals:3];
    
    [NSTimer scheduledTimerWithTimeInterval:(float)3.0 target:self selector:@selector(connectionTimer:) userInfo:nil repeats:NO];
   
    
    isFindingLast = true;
    self.lastButton.enabled = false;
    self.scanButton.enabled = false;
    self.curtain.hidden = false;
    self.spinner.hidden = false;
    [self.spinner startAnimating];
}


// Called when scan period is over 
-(void) connectionTimer:(NSTimer *)timer
{
    if(bleShield.peripherals.count > 0)
    {
        //to connect to the peripheral with a particular UUID
        if(isFindingLast)
        {
            int i;
            for (i = 0; i < bleShield.peripherals.count; i++)
            {
                CBPeripheral *p = [bleShield.peripherals objectAtIndex:i];
                
                //if (p.UUID != NULL)
                if (p.identifier.UUIDString != NULL)
                {
                    //Comparing UUIDs and call connectPeripheral is matched
                    //if([self.lastUUID isEqualToString:[self getUUIDString:p.UUID]])
                    if([self.lastUUID isEqualToString:p.identifier.UUIDString])
                    {
                        [bleShield connectPeripheral:p];
                    }
                }
            }
        }
        //Scan for all BLE in range and prepare a list
        else
        {
            [self.mDevices removeAllObjects];
            
            int i;
            for (i = 0; i < bleShield.peripherals.count; i++)
            {
                CBPeripheral *p = [bleShield.peripherals objectAtIndex:i];
                
                //if (p.UUID != NULL)
                if (p.identifier.UUIDString != NULL)
                {
                    //[self.mDevices insertObject:[self getUUIDString:p.UUID] atIndex:i];
                    [self.mDevices insertObject:p.identifier.UUIDString atIndex:i];

                }
                else
                {
                    [self.mDevices insertObject:@"NULL" atIndex:i];
                }
            }
            
            //Show the list for user selection
            [self performSegueWithIdentifier:@"showDevice" sender:self];
        }
    }
    else
    {
        [self.spinner stopAnimating];
            self.spinner.hidden = true;
        if (self.lastUUID.length == 0)
        {
            self.lastButton.enabled = false;
            self.curtain.hidden = true;
        }
        else
        {
            self.lastButton.enabled = true;
            self.curtain.hidden = true;
        }
        
        self.scanButton.enabled = true;
        self.curtain.hidden = true;
    }

}

//Show device list for user selection
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    if ([[segue identifier] isEqualToString:@"showDevice"])
    {
        RBLDetailViewController *vc =[segue destinationViewController] ;
        vc.BLEDevices = self.mDevices;
        vc.delegate = self;
    }
}

- (void)didSelected:(NSInteger)index
{
    self.scanButton.enabled = false;
    [bleShield connectPeripheral:[bleShield.peripherals objectAtIndex:index]];
}

    NSMutableString *myOldText;
    NSMutableString *myText;


int byteCounter = 0;
unsigned int holder0l = 0;
unsigned int holder0h = 0;
unsigned int holder1l = 0;
unsigned int holder1h = 0;
unsigned int holder2l = 0;
unsigned int holder2h = 0;
unsigned int holder3l = 0;
unsigned int holder3h = 0;
unsigned int holder4l = 0;
unsigned int holder4h = 0;
unsigned int holder5l = 0;
unsigned int holder5h = 0;
unsigned int holder6l = 0;
unsigned int holder6h = 0;
unsigned int holder7l = 0;
unsigned int holder7h = 0;
unsigned int holder8l = 0;
unsigned int holder8h = 0;

int readingsCounter = 0;


-(void) bleDidReceiveData:(unsigned char *)data length:(int)length
{
//    if(start != nil){
//        NSTimeInterval timeInterval = [start timeIntervalSinceNow];
//        NSLog(@"Readings: %i, Time: %f, Data: %s", readingsCounter, timeInterval, data);
//    }
//
//    readingsCounter++;
//    
//    start = [NSDate date];
    // do stuff...

//    NSOperationQueue *theQueue = [[NSOperationQueue alloc] init];
//    
//    __block CMAccelerometerData *_returnedData = [[CMAccelerometerData alloc] init];
//    
//    CMMotionManager *_motionManager = [[CMMotionManager alloc] init];
//    
//    [_motionManager startAccelerometerUpdatesToQueue:theQueue withHandler:^(CMAccelerometerData *accelerometerData, NSError *error) {
//        
//        _returnedData = _motionManager.accelerometerData;
//        
//        int x = _motionManager.accelerometerData.acceleration.x;
//        int y = _returnedData.acceleration.y;
//        
//        NSLog(@"X: %i, Y: %i", x, y);
//    }];
//    
//    byteCounter++;
//    NSLog(@"byteCounter: %i, data: %d", byteCounter, *data);
//    if(byteCounter == 18){
//        byteCounter = 0;
//        NSLog(@"RESET: %i", byteCounter);
//    }
//    
//    if(byteCounter == 0){
//        holder = *data;
//    }else if(byteCounter == 1){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        NSLog(@"holder: %i", holder);
//        self.s1.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 2){
//        holder = data[0];
//    }else if(byteCounter == 3){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s2.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 4){
//        holder = data[0];
//    }else if(byteCounter == 5){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s3.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 6){
//        holder = data[0];
//    }else if(byteCounter == 7){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s4.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 8){
//        holder = data[0];
//    }else if(byteCounter == 9){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s5.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 10){
//        holder = data[0];
//    }else if(byteCounter == 11){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s6.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 12){
//        holder = data[0];
//    }else if(byteCounter == 13){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s7.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 14){
//        holder = data[0];
//    }else if(byteCounter == 15){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s8.text = [NSString stringWithFormat: @"%i", holder];
//    }else if(byteCounter == 16){
//        holder = data[0];
//    }else if(byteCounter == 17){
//        holder2 = data[0];
//        holder = (holder << 8) + holder2;
//        self.s9.text = [NSString stringWithFormat: @"%i", holder];
//    }

//    holder0l = data[0];
//    holder0h = data[1];
//    holder1l = data[2];
//    holder1h = data[3];
//    holder2l = data[4];
//    holder2h = data[5];
//    holder3l = data[6];
//    holder3h = data[7];
//    holder4l = data[8];
//    holder4h = data[9];
//    holder5l = data[10];
//    holder5h = data[11];
//    holder6l = data[12];
//    holder6h = data[13];
//    holder7l = data[14];
//    holder7h = data[15];
//    holder8l = data[16];
//    holder8h = data[17];
    
//    holder0l = (holder0h << 8) + holder0l;
//    holder1l = (holder1h << 8) + holder1l;
//    holder2l = (holder2h << 8) + holder2l;
//    holder3l = (holder3h << 8) + holder3l;
//    holder4l = (holder4h << 8) + holder4l;
//    holder5l = (holder5h << 8) + holder5l;
//    holder6l = (holder6h << 8) + holder6l;
//    holder7l = (holder7h << 8) + holder7l;
//    holder8l = (holder8h << 8) + holder8l;
    
//    self.s1.text = [NSString stringWithFormat: @"%i", holder0l];
//    self.s2.text = [NSString stringWithFormat: @"%i", holder1l];
//    self.s3.text = [NSString stringWithFormat: @"%i", holder2l];
//    self.s4.text = [NSString stringWithFormat: @"%i", holder3l];
//    self.s5.text = [NSString stringWithFormat: @"%i", holder4l];
//    self.s6.text = [NSString stringWithFormat: @"%i", holder5l];
//    self.s7.text = [NSString stringWithFormat: @"%i", holder6l];
//    self.s8.text = [NSString stringWithFormat: @"%i", holder7l];
//    self.s9.text = [NSString stringWithFormat: @"%i", readingsCounter];
    
//    self.serialData.text = [[NSString alloc]initWithUTF8String:data];
//    int myTestVal = [[NSNumber numberWithUnsignedChar:*data] intValue];

//    myText = [NSMutableString stringWithFormat: @"%d", myTestVal];
//    [myOldText appendString: @"\n"];
//    [myOldText appendString: myText];
//    self.serialData.text = myOldText;
    if(data[0] == 0xff){
     // GO!
        [self.recordButton setTitle:@"Stop Recording" forState:normal];
        saveFile = true;
        // Set the documents directory path to the documentsDirectory property.
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        self.documentsDirectory = [paths objectAtIndex:0];
        
        // Keep the database filename.
        self.theFilename = @"data.txt";
        
        // Copy the database file into the documents directory if necessary.
        
        [self copyFileIntoDocumentsDirectory];
        
        
        
        
        //        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        //      NSString *documentsDirectory = [paths objectAtIndex:0];
        //        NSString *appFile = [documentsDirectory stringByAppendingPathComponent:@"MyFile"];
        //        [data writeToFile:appFile atomically:YES];
        
        //        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask, YES);
        NSString *documentsDirectory = [paths objectAtIndex:0];
        NSString *documentTXTPath = [documentsDirectory stringByAppendingPathComponent:@"data.txt"];
        NSString *savedString = @"time,aX,aY,aZ,rX,rY,rZ,lat,lon\n";
       // NSFileHandle *myHandle = [NSFileHandle fileHandleForUpdatingAtPath:documentTXTPath];
        //        [myHandle writeData:[savedString dataUsingEncoding:NSUTF8StringEncoding]];
        [[savedString dataUsingEncoding:NSUTF8StringEncoding] writeToFile:documentTXTPath atomically:YES];
        
        [self.motionManager startAccelerometerUpdatesToQueue:[NSOperationQueue currentQueue]
                                                 withHandler:^(CMAccelerometerData  *accelerometerData, NSError *error) {
                                                     [self outputAccelertionData:accelerometerData.acceleration];
                                                     if(error){
                                                         
                                                         NSLog(@"%@", error);
                                                     }
                                                 }];
        
        [self.motionManager startGyroUpdatesToQueue:[NSOperationQueue currentQueue]
                                        withHandler:^(CMGyroData *gyroData, NSError *error) {
                                            [self outputRotationData:gyroData.rotationRate];
                                        }];
        
    }else if(data[0] == 0x00){
        [self.recordButton setTitle:@"Start Recording" forState:normal ];
        saveFile = false;
        
        [self.motionManager stopAccelerometerUpdates];
        [self.motionManager  stopGyroUpdates];
    }
  
}



- (void) bleDidDisconnect
{
    self.lastButton.enabled = true;
    self.rssiLabel.hidden = true;
    [self.scanButton setTitle:@"Scan"];
}

-(void) bleDidConnect
{
    //Save UUID into system
    //self.lastUUID = [self getUUIDString:bleShield.activePeripheral.UUID];
    self.lastUUID = bleShield.activePeripheral.identifier.UUIDString;
    [[NSUserDefaults standardUserDefaults] setObject:self.lastUUID forKey:UUIDPrefKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    [self.spinner stopAnimating];
    self.spinner.hidden = true;
    self.curtain.hidden = true;
    self.lastButton.enabled = false;
    self.scanButton.enabled = true;
    self.uuidLabel.text = self.lastUUID;
    self.rssiLabel.text = @"RSSI: ?";
    self.rssiLabel.enabled = true;
    [self.scanButton setTitle:@"Disconnect" ];
}

-(void) bleDidUpdateRSSI:(NSNumber *)rssi
{
    self.rssiLabel.text = [NSString stringWithFormat:@"RSSI: %@", rssi.stringValue];
}


-(NSString*)getUUIDString:(CFUUIDRef)ref {
    NSString *str = [NSString stringWithFormat:@"%@",ref];
    return [[NSString stringWithFormat:@"%@",str] substringWithRange:NSMakeRange(str.length - 36, 36)];
}






@end
