// Sensor & iOS Merge


var blob = '';
var blob2 = '';
var blobMerge = '';
var myArray = [];
var myArray2 = [];




// Button functions
//------------------------------------------------------------------------------

//	This is the reload button on the connection screen, simply reloads the app
$('.reload_app').click(function() {
	chrome.runtime.reload();
});

$('.file1').click(function(){
	var config = {
		type: 'openFile',
	};
	chrome.fileSystem.chooseEntry(config, function(fileEntry) {
    // Get a File object representing the file,
    // then use FileReader to read its contents.
    fileEntry.file(function(file) {
       var reader = new FileReader();

       reader.onloadend = function(e) {
        blob = this.result;
				myArray = CSVToArray(blob);
				var itemDate = new Date(myArray[0][0]);
				var itemSeconds = itemDate.valueOf();
				$('.file1output').html("Loaded!");
				if(blob2 != ""){
					$('.mergeFiles').show();
				}
       };

       reader.readAsText(file);

    }, errorHandler);

  });
});

$('.file2').click(function(){
	var config = {
		type: 'openFile',
	};
	chrome.fileSystem.chooseEntry(config, function(fileEntry) {
    // Get a File object representing the file,
    // then use FileReader to read its contents.
    fileEntry.file(function(file) {
       var reader = new FileReader();

       reader.onloadend = function(e) {
        blob2 = this.result;
				myArray2 = CSVToArray(blob2);
				var testDate = new Date(myArray2[0][0]);
				var testSeconds = testDate.valueOf() - 20*60*60*1000;
				$('.file2output').html("Loaded!");
				if(blob != ""){
					$('.mergeFiles').show();
				}
       };

       reader.readAsText(file);


    }, errorHandler);

  });
});

var didFind = 0;
var counter = 0;
var mergeArray = [];
var pushCounter = 0;
var myArrayCounter = 0;
$('.mergeFiles').click(function(){
	if(blob != "" && blob2 !=""){
		// blobMerge = blob + blob2;
		// $('.blobMergeOutput').html(blobMerge);
		blobMerge = "time,s0,s1,s2,s3,s4,s5,s6,s7,s8,aX,aY,aZ,rX,rY,rZ,lat,lon\n";
		myArray.forEach(function(item) {
			didFind = 0;
			var itemDate = new Date(item[0]);
			var itemSeconds = itemDate.valueOf();
			while(didFind == 0 || counter == myArray2.length){
					var testDate = new Date(myArray2[counter][0]);
					var testSeconds = testDate.valueOf() - 20*60*60*1000;
					if(testSeconds == itemSeconds){
						// PUSH item and myArray2[counter][1-8]
						blobMerge += item[0]+","+item[1]+","+item[2]+","+item[3]+","+item[4]+","+item[5]+","+item[6]+","+item[7]+","+item[8]+","+item[9]+","+myArray2[counter][1]+","+myArray2[counter][2]+","+myArray2[counter][3]+","+myArray2[counter][4]+","+myArray2[counter][5]+","+myArray2[counter][6]+","+myArray2[counter][7]+","+myArray2[counter][8]+"\n";
						didFind = 1;
						pushCounter++;
						counter++;
						console.log("FOUND! " + counter + ", Push: " + pushCounter + ", MyArray: " + myArrayCounter);
					}else if(itemSeconds < testSeconds){
						//mergeArray.push([item[0],item[1],item[2],item[3],item[4],item[5],item[6],item[7],item[8],item[9],myArray2[counter][1],myArray2[counter][2],myArray2[counter][3],myArray2[counter][4],myArray2[counter][5],myArray2[counter][6],myArray2[counter][7],myArray2[counter][8]]);
						didFind = 1;
						console.log("FOUND! Repeat " + counter + ", Push: " + pushCounter + ", MyArray: " + myArrayCounter);
					}else if(testSeconds < itemSeconds){
						counter++;
					}else{
						didFind = 1;
					}

				}

				myArrayCounter++;
		});

		// To add a header row to CSV append the header to the being of
		// the "blob" variable
		var config = {
			type: 'saveFile',
			suggestedName: event.timeStamp + '.csv'
		};
		chrome.fileSystem.chooseEntry(config, function(writableEntry) {
			var blobSave = new Blob([blobMerge], {
				type: 'text/plain'
			});
			writeFileEntry(writableEntry, blobSave, function(e) {});
		});
	}

});
// Supporting functions
//------------------------------------------------------------------------------

Number.prototype.map = function(in_min, in_max, out_min, out_max) {
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
Updated: Joe Marini (joemarini@google.com)
*/

var chosenEntry = null;
var saveFileButton = document.querySelector('#save_file');

function errorHandler(e) {
	console.error(e);
}

function displayEntryData(theEntry) {
	if (theEntry.isFile) {
		chrome.fileSystem.getDisplayPath(theEntry, function(path) {
			document.querySelector('#file_path').value = path;
		});
		theEntry.getMetadata(function(data) {
			document.querySelector('#file_size').textContent = data.size;
		});
	} else {
		document.querySelector('#file_path').value = theEntry.fullPath;
		document.querySelector('#file_size').textContent = "N/A";
	}
}

function readAsText(fileEntry, callback) {
	fileEntry.file(function(file) {
		var reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onload = function(e) {
			callback(e.target.result);
		};
		reader.readAsText(file);
	});
}

function writeFileEntry(writableEntry, opt_blob, callback) {
	if (!writableEntry) {
		output.textContent = 'Nothing selected.';
		return;
	}
	writableEntry.createWriter(function(writer) {
		writer.onerror = errorHandler;
		writer.onwriteend = callback;
		// If we have data, write it to the file. Otherwise, just use the file we
		// loaded.
		if (opt_blob) {
			writer.truncate(opt_blob.size);
			waitForIO(writer, function() {
				writer.seek(0);
				writer.write(opt_blob);
			});
		} else {
			chosenEntry.file(function(file) {
				writer.truncate(file.fileSize);
				waitForIO(writer, function() {
					writer.seek(0);
					writer.write(file);
				});
			});
		}
	}, errorHandler);
}

function waitForIO(writer, callback) {
	// set a watchdog to avoid eventual locking:
	var start = Date.now();
	// wait for a few seconds
	var reentrant = function() {
			if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
				setTimeout(reentrant, 100);
				return;
			}
			if (writer.readyState === writer.WRITING) {
				console.error("Write operation taking too long, aborting!" + " (current writer readyState is " + writer.readyState + ")");
				writer.abort();
			} else {
				callback();
			}
		};
	setTimeout(reentrant, 100);
}
// for files, read the text content into the textarea

function loadFileEntry(_chosenEntry) {
	chosenEntry = _chosenEntry;
	chosenEntry.file(function(file) {
		readAsText(chosenEntry, function(result) {
			textarea.value = result;
		});
		// Update display.
		saveFileButton.disabled = false; // allow the user to save the content
		displayEntryData(chosenEntry);
	});
}
// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button

function loadDirEntry(_chosenEntry) {
	chosenEntry = _chosenEntry;
	if (chosenEntry.isDirectory) {
		var dirReader = chosenEntry.createReader();
		var entries = [];
		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
				dirReader.readEntries(function(results) {
					if (!results.length) {
						textarea.value = entries.join("\n");
						saveFileButton.disabled = true; // don't allow saving of the list
						displayEntryData(chosenEntry);
					} else {
						results.forEach(function(item) {
							entries = entries.concat(item.fullPath);
						});
						readEntries();
					}
				}, errorHandler);
			};
		readEntries(); // Start reading dirs.
	}
}

function loadInitialFile(launchData) {
	if (launchData && launchData.items && launchData.items[0]) {
		loadFileEntry(launchData.items[0].entry);
	} else {
		// see if the app retained access to an earlier file or directory
		chrome.storage.local.get('chosenFile', function(items) {
			if (items.chosenFile) {
				// if an entry was retained earlier, see if it can be restored
				chrome.fileSystem.isRestorable(items.chosenFile, function(bIsRestorable) {
					// the entry is still there, load the content
					console.info("Restoring " + items.chosenFile);
					chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
						if (chosenEntry) {
							chosenEntry.isFile ? loadFileEntry(chosenEntry) : loadDirEntry(chosenEntry);
						}
					});
				});
			}
		});
	}
}


function binaryblob() {
	var byteString = atob(document.querySelector("canvas").toDataURL().replace(/^data:image\/(png|jpg);base64,/, ""));
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	var dataView = new DataView(ab);
	var blobX = new Blob([dataView], {
		type: "image/png"
	});
	var DOMURL = self.URL || self.webkitURL || self;
	var newurl = DOMURL.createObjectURL(blobX);
	var config = {
		type: 'saveFile',
		suggestedName: event.timeStamp + '.png'
	};
	chrome.fileSystem.chooseEntry(config, function(writableEntry) {
		var blobSave = new Blob([dataView], {
			type: "image/png"
		});
		writeFileEntry(writableEntry, blobSave, function(e) {});
	});
}

function dataURLToBlob(dataURL) {
	var BASE64_MARKER = ';base64,';
	if (dataURL.indexOf(BASE64_MARKER) == -1) {
		var parts = dataURL.split(',');
		var contentType = parts[0].split(':')[1];
		var raw = decodeURIComponent(parts[1]);
		return new Blob([raw], {
			type: contentType
		});
	}
	var parts = dataURL.split(BASE64_MARKER);
	var contentType = parts[0].split(':')[1];
	var raw = window.atob(parts[1]);
	var rawLength = raw.length;
	var uInt8Array = new Uint8Array(rawLength);
	for (var i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}
	return new Blob([uInt8Array], {
		type: contentType
	});
}


function CSVToArray(strData, strDelimiter) {
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");
	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp((
	// Delimiters.
	"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
	// Quoted fields.
	"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
	// Standard fields.
	"([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [
		[]
	];
	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;
	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec(strData)) {
		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[1];
		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
		strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push([]);
		}
		var strMatchedValue;
		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[2]) {
			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[2].replace(
			new RegExp("\"\"", "g"), "\"");
		} else {
			// We found a non-quoted value.
			strMatchedValue = arrMatches[3];
		}
		// Now that we have our value string, let's add
		// it to the data array.
		arrData[arrData.length - 1].push(strMatchedValue);
	}
	// Return the parsed data.
	return (arrData);
}
