/*
 * beatMatcher.js
 *
 * Created by Michael 'TopRamenGod' Varner on 02-FEB-2017
 * Copyright 2017 High Fidelity, Inc.
 *
 * This entity script adds the remaining entities and handles the logic for a rhythm practice toy,
 * created with createBeatMatcher.js
 *
 *
 * -- Lore --
 * "The BeatMatcher 5000.
 *
 * 'A scaled-down version of the BeatMatcher 9000.'
 *
 * Hit the Drum to start by either clicking it with your mouse, or hit with your avatar's hands. Hit the drum in time
 * with the beat to practice your rhythm! How many beats can you stay in time with?
 *
 * Are you a BeatMatch Hero?"
 *
 *
 * -- Description and Usage --
 * The general internal flow of this current iteration is to use a Date comparision as points in actual time for our BPM
 * rhythm (theDrumObjThis.futureBeat), and a rapid 5 ms 'heartbeat' style setInterval timer to frequently check if it is
 * time for the *next* beat in time to fire (theDrumObjThis.beatIntervalID). This is an attempt to counter the inherent
 * unreliability of Javascript timers.
 *
 * For hand controller detection, since there are no default colliders for avatar hands, frequent checks against a distance
 * threshold serves this purpose (Drum.checkForHandControllerDrumHit) by being registered with the Script.update method.
 *
 * The Scoreboard is an addressable and formattable marquee created from a text entity. Since the text entity currently
 * has no formatting capabilities, this script provides methods for justifying the contents of each line of the scoreboard.
 *
 * The general update flow of updating the scoreboard is as follows:
 *      - scoreboardDisplay = getNewScoreboardDisplay // get new, blank display object
 *      - build scoreBoardDisplay by line:
 *          scoreboardDisplay[1] = //line1 stuff
 *          scoreboardDisplay[2] = //line2 stuff....etc
 *      - updateScoreboard(scoreboardDisplay) // updates scoreboard!
 *  *
 * Use the Scoreboard.prototype.padLine( str, justification ) method to justify the contents of each line.
 *
 *
 * -- Misc --
 * Developer's Note: the current text entity font is not fixed width, so it's kind of difficult to format lines with precision, but
 * this gets closer than nothing. :)
 *
 *
 * Distributed under the Apache License, Version 2.0.
 * See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
 */


(function() {

    // Displays accuracy, score, and various messages
    var Scoreboard = function(position) {

        // For clearer scope
        theScoreboardObjThis = this;

        var scoreboardProperties = {
            position: position,
            type: "Text",
            name: "BeatMatcher_Scoreboard",
            parentID: myDrum.entityID,
            dimensions: {
                x: 0.5075,
                y: 0.425,
                z: 0.1
            },
            text: "Hit/click the sphere to start!",
            lineHeight: 0.05,
            textColor: {red: 255, green: 255, blue: 255},
            backgroundColor: {red: 0, green: 0, blue: 0},
            defaultFaceCamera: true,
            lifetime: -1
        }

        theScoreboardObjThis._scoreboard = Entities.addEntity(scoreboardProperties);

        // :: Scoreboard State Text Colors ::
        theScoreboardObjThis.DEFAULT_TEXT_COLOR = {red: 255, green: 255, blue: 255};            // White
        theScoreboardObjThis.UNCLICKED_BEAT_TEXT_COLOR = {red: 0, green: 0, blue: 255};         // Blue
        theScoreboardObjThis.MATCHED_BEAT_TEXT_COLOR = {red: 212, green: 250, blue: 205};       // Light Green
        theScoreboardObjThis.MISSED_BEAT_TEXT_COLOR = {red: 232, green: 190, blue: 160};        // Light Orange
        theScoreboardObjThis.GREETING_TEXT_COLOR = {red: 0, green: 255, blue: 0};               // Green
        theScoreboardObjThis.BEAT_HIGH_SCORE_TEXT_COLOR = {red: 255, green: 128, blue: 0};      // Dark Orange
        theScoreboardObjThis.SHOW_HIGH_SCORE_TEXT_COLOR = {red: 200, green: 128, blue: 100};    // Muted Dark Orange?

        // :: Scoreboard messages ::
        theScoreboardObjThis.scoreboardMatchResponseList = [
            "Beat matched!",
            "Well done!",
            "Awesome!!!",
            "good",
            "GREAT!",
            "Superb!"
        ];
        theScoreboardObjThis.scoreboardMissResponseList = [
            "Beat missed :(",
            "NOPE",
            "fail.",
            "miss.",
            "MISS",
            "You can do better...",
            "try again",
            "hmm..."
        ];
        theScoreboardObjThis.scoreboardStrings = {
            "BEATMATCHER_NAME": "BeatMatcher 5000",
            "START_1": "Hit/click the",
            "START_2": "sphere to start!",
            "GAME_OVER": "GAME OVER",
            "TIME_LATE": " ms late",
            "TIME_SCALE": "ms",
            "HIGH_SCORE": "High Score: ",
            "NEW_HIGH_SCORE": "New high score!: ",
            "BEAT_HIGH_SCORE": "You beat the high score!",
            "BEATS_MATCHED": "Beats Matched: ",
            "BEATS_MISSED": "Beats Missed: ",
            "BEATS_PLAYED": "Beats Played: ",
            "LAST_BEAT_MATCH": "Last match: ",
            "MATCHES": " matches",
            "MATCHES_EXCL": " Matches!!!",
            "HEADER_PADDING": "=",
            "FOOTER_PADDING": "=",
            "BORDER_ENDS": "|",
            "LINE_PADDING": " ",
            // "LINE_PADDING": "+",        // test character for alignment. Semi-reliable.
            "LAST_BEAT_ERROR": "Last hit offset: ",
            "AVERAGE_ERROR": "Avg. offset: ",
            "YEAR_LINE": "(2017 High Fidelity)",
        };

        // Scoreboard Display Object Dimensions
        // Helps keep your lines the length that fit best given text entity dimensions and lineHeight
        /* TODO: find a programmatic way to define initial line length by text entity dimensions and lineHeight */
        theScoreboardObjThis.REQUIRED_LINE_LENGTH = 22;
        theScoreboardObjThis.NUM_DISPLAY_LINES = 8;

        theScoreboardObjThis.scoreboardGreeting = theScoreboardObjThis.getScoreboardGreeting();

    };

    Scoreboard.prototype = {
        setScoreboard: function(newTextProperty, newTextColorProperty) {
            Entities.editEntity(theScoreboardObjThis._scoreboard, newTextProperty, newTextColorProperty);
        },

        // returns a pre-formatted scoreboard title and screen border line
        getScoreboardBorder: function(){
            return theScoreboardObjThis.scoreboardStrings.BORDER_ENDS +
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.HEADER_PADDING,
                    theScoreboardObjThis.REQUIRED_LINE_LENGTH-3
                ) +
                theScoreboardObjThis.scoreboardStrings.BORDER_ENDS
        },

        // returns a scoreboard greeting template of a new scoreboard display object
        getScoreboardGreeting: function(){

            // get new scoreboard display object
            newScoreboardGreeting = this.getNewScoreboardDisplay();

            // update each the scoreboard display object lines we want to use
            newScoreboardGreeting["0"] = this.getScoreboardBorder() + "\n";

            newScoreboardGreeting["1"] =
                theScoreboardObjThis.justifyLine(theScoreboardObjThis.scoreboardStrings.BEATMATCHER_NAME, "center");

            newScoreboardGreeting["2"] = this.getScoreboardBorder() + "\n";

            newScoreboardGreeting["4"] =
                theScoreboardObjThis.justifyLine(theScoreboardObjThis.scoreboardStrings.START_1, "left");

            newScoreboardGreeting["5"] =
                theScoreboardObjThis.justifyLine(theScoreboardObjThis.scoreboardStrings.START_2, "right");

            newScoreboardGreeting["7"] =
                theScoreboardObjThis.justifyLine(theScoreboardObjThis.scoreboardStrings.YEAR_LINE, "right");


            return newScoreboardGreeting;

        },

        // get new, blank display lines object, addressable by line, so we only need update the lines we care about.
        getNewScoreboardDisplay: function() {

            var emptyScoreboardDisplay = {};

            // create NUM_DISPLAY_LINES blank lines
            for(i=0; i < theScoreboardObjThis.NUM_DISPLAY_LINES - 1; i++){
                emptyScoreboardDisplay[i.toString()] =
                    theScoreboardObjThis.repeatString(
                        theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                        theScoreboardObjThis.REQUIRED_LINE_LENGTH - 2
                ) + "\n";
            }
            return emptyScoreboardDisplay;
        },

        // Takes in scoreboard display object and updates scoreboard entity
        updateScoreboard: function(newScoreboardDisplay, newScoreboardTextColor){

            // Default color parameter
            if(!newScoreboardTextColor){
                var newScoreboardTextColor = theScoreboardObjThis.DEFAULT_TEXT_COLOR;
            }

            var newScoreboardText = "";

            // Concat display object "lines" into string for text entity.
            Object.keys(newScoreboardDisplay).forEach(function(line){

                // concat each line
                newScoreboardText = newScoreboardText + newScoreboardDisplay[line];
            });

            // Update scoreboard text entity!
            this.setScoreboard(
                {text: newScoreboardText,
                textColor: newScoreboardTextColor}
            );

        },

        // returns a string that has been repeated n times
        repeatString: function(str, n){
            return new Array(n + 1).join(str);
        },

        // Justify the contents of a line relative to REQUIRED_LINE_LENGTH. Align left, center or right.
        justifyLine: function(line, justification){

            // Pad or truncate to guarantee display "line" length.
            if(line.length < theScoreboardObjThis.REQUIRED_LINE_LENGTH -1){             // pad line if too short

                // get length of padding
                lineEditLength = theScoreboardObjThis.REQUIRED_LINE_LENGTH - line.length;

                // Center justify line with LINE_PADDING string
                if(justification == "center") {

                    // add SIDE padding to left and right sides of line, with return character
                    line =
                        theScoreboardObjThis.repeatString(
                            theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                            Math.floor(lineEditLength / 2)
                        ) +
                        line +
                        theScoreboardObjThis.repeatString(
                            theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                            Math.floor(lineEditLength / 2)
                        ) + "\n";
                }

                // RIGHT justify line with LINE_PADDING string
                if(justification == "right") {

                    // get length of padding
                    lineEditLength = theScoreboardObjThis.REQUIRED_LINE_LENGTH - line.length;

                    // get start point of padding
                    lineEditStartIndex = Math.abs(
                        line.length - theScoreboardObjThis.REQUIRED_LINE_LENGTH);

                    // add padding to LEFT side of line, with return character
                    line = theScoreboardObjThis.repeatString(
                            theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                            lineEditLength
                        ) + line + "\n";
                }

                // LEFT justify line with LINE_PADDING string
                if(justification == "left") {

                    // get length of padding
                    lineEditLength = theScoreboardObjThis.REQUIRED_LINE_LENGTH - line.length;

                    // get start point of padding
                    lineEditStartIndex = Math.abs(
                        line.length - theScoreboardObjThis.REQUIRED_LINE_LENGTH);

                    // add padding to RIGHT side of line, with return character
                    line = line +
                        theScoreboardObjThis.repeatString(
                            theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                            lineEditLength
                        ) +  "\n";
                }

            } else if (line > theScoreboardObjThis.REQUIRED_LINE_LENGTH -1) {           // truncate line if too long

                // get newly truncated line
                line = line.substring(
                        0, theScoreboardObjThis.REQUIRED_LINE_LENGTH) + "\n";
            }

            return line;
        },

        deleteScoreboard: function() {
            Entities.deleteEntity(theScoreboardObjThis._scoreboard);
        },
    };

    Drum = function() {

        // For clearer understanding of scoping
        theDrumObjThis = this;

        // :: Drum State Colors ::
        this.UNCLICKED_BEAT_TEXT_COLOR = {color: {red: 0, green: 0, blue: 255}};      // Blue
        this.matchColor = {color: {red: 0, green: 255, blue: 0}};     // Green
        this.missColor = {color: {red: 255, green: 128, blue: 0}};    // Dark Orange

        // ::: Mouse Click Operation :::
        this.clickDownOnEntity = function(entityID, mouseEvent){
            if (Entities.getEntityProperties(theDrumObjThis.entityID).name == "BeatMatcher_Drum") {
                theDrumObjThis.hitDrum();
            }
        };

        rightHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_RIGHTHAND");
        leftHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_LEFTHAND");
        var handInRadius = false;

        // ::: Hand Controller Operation :::
        this.checkForHandControllerDrumHit = function(){

            var drumRadius = Entities.getEntityProperties(theDrumObjThis.entityID).dimensions.x / 2;

            // hand controller distance to drum
            var rightHandDistanceToDrum = Vec3.distance(MyAvatar.getJointPosition("RightHandIndex4"),
                Entities.getEntityProperties(theDrumObjThis.entityID).position);
            var leftHandDistanceToDrum = Vec3.distance(MyAvatar.getJointPosition("LeftHandIndex4"),
                Entities.getEntityProperties(theDrumObjThis.entityID).position);

            if (!handInRadius && (rightHandDistanceToDrum <= drumRadius || leftHandDistanceToDrum <= drumRadius)) {
                handInRadius = true;
                theDrumObjThis.hitDrum();
            }

            // hysteresis to avoid 'bouncing' detection
            if (handInRadius && (rightHandDistanceToDrum >= drumRadius * 1.1 && leftHandDistanceToDrum >= drumRadius * 1.1)) {
                handInRadius = false;
            }
        };

        // register checkForHandControllerDrumHit callback
        Script.update.connect(this.checkForHandControllerDrumHit);    // This may simply be checking too often

        // ::: Helper functions :::
        this.getIntervalFromBpm = function(bpm){ return 60000 / bpm; };

        this.getAverageFromList = function(list) {
            var sum = list.reduce(function (acc, val) {
                return acc + val;
            }, 0);
            return Math.floor(sum / list.length);                     // The player probably doesn"t care about precision
        };                                                            // to the millionth of a second, so Math.floor()

        this.getRandomInt = function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

        // Update high score if high score beaten
        this.checkUpdateHighScore = function(currentScore){
            if(currentScore > theDrumObjThis.highScore){
                theDrumObjThis.highScore = currentScore;
                return true;
            } else {
                return false;
            }
        };

        // Timing
        // e.g.: 60,000 ms / 120 BPM = 500 ms per beat. Inherent latency is much more manageable at lower BPMs.
        this.BPM = 80;
        this.MISS_LIMIT = 5;
        this.BPM_CHECK_HEARTBEAT_INTERVAL = 5;
        this.beatCounter = 0;
        this.beatAttempted = false;
        this.hasBeatStarted = false;

        // Error in beat timing
        this.averageError = 0;

        // Matches and Misses
        this.beatsMatched = 0;
        this.beatsMissed = 0;

        // Scoreboard object
        this.myScoreboard = {};
        this.newScoreboardDisplay = {};

        // High Score
        this.highScore = 0;

        this.SCOREBOARD_RESET_DELAY = 6000;

    };

    Drum.prototype = {

        hitDrum: function(){

            // print("XXXX HIT DRUM XXXX");

            // :::: Start beat ::::
            if(!myDrum.hasBeatStarted && myDrum.beatCounter <= 0) {

                // set timestamp for *first* beat
                myDrum.futureBeat = Date.now() + myDrum.getIntervalFromBpm(myDrum.BPM);

                myDrum.hasBeatStarted = true;
                this.shouldCheckTime = true;
                this.startBeat();

            // :::: Check drum hit if already started ::::
            } else if(myDrum.hasBeatStarted && (myDrum.beatCounter > 0 && myDrum.beatsMissed <= myDrum.MISS_LIMIT)){

                // :::: Check if Drum hit is beat miss or match ::::
                this.checkDrumHit();
            }
        },
        startBeat: function() {     // most of the active game logic happens here

            // print("++++STARTING BEAT++++");

            // Reset matches and misses
            myDrum.beatsMatched = 0;
            myDrum.beatsMissed = 0;

            // heartBeat interval for checking to see if the right amount of time has passed for a beat to occur
            myDrum.beatIntervalID = Script.setInterval(function () {

                if(Date.now() >= myDrum.futureBeat) {

                    // set timestamp for *next* beat
                    myDrum.futureBeat = Date.now() + myDrum.getIntervalFromBpm(myDrum.BPM);

                    // Start beat timer
                    myDrum.timeAtStartOfBeat = new Date();

                    // :::: Stop drum after beatsMissed limit - GAME OVER ::::
                    if (myDrum.beatsMissed >= myDrum.MISS_LIMIT) {

                        // Stop beat
                        myDrum.stopBeat();

                        // Check beats matched against high score
                        if (myDrum.checkUpdateHighScore(myDrum.beatsMatched)) {

                            myDrum.newScoreboardDisplay = myDrum.myScoreboard.getNewScoreboardDisplay();

                            // Build new scoreboard display - Game over, beat high score
                            myDrum.newScoreboardDisplay[0] = myDrum.myScoreboard.getScoreboardBorder() + "\n";

                            myDrum.newScoreboardDisplay[1] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.NEW_HIGH_SCORE, "center");

                            myDrum.newScoreboardDisplay[2] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.highScore + myDrum.myScoreboard.scoreboardStrings.MATCHES_EXCL,
                                    "center"
                                );

                            myDrum.newScoreboardDisplay[3] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                                    theDrumObjThis.offset,
                                    "center"
                                );

                            myDrum.newScoreboardDisplay[4] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                                    Math.round(theDrumObjThis.averageError,1) + " " +
                                    myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                                    "center"
                                );

                            myDrum.newScoreboardDisplay[6] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.GAME_OVER,"center");

                            myDrum.newScoreboardDisplay[7] = myDrum.myScoreboard.getScoreboardBorder();

                            // Update scoreboard display!
                            myDrum.myScoreboard.updateScoreboard(
                                myDrum.newScoreboardDisplay,
                                myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR);

                        } else {

                            myDrum.newScoreboardDisplay = myDrum.myScoreboard.getNewScoreboardDisplay();

                            // Build new scoreboard display - Game over, did not beat high score
                            myDrum.newScoreboardDisplay[0] = myDrum.myScoreboard.getScoreboardBorder() + "\n";

                            myDrum.newScoreboardDisplay[1] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.GAME_OVER,
                                    "center"
                                );

                            myDrum.newScoreboardDisplay[2] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.HIGH_SCORE +
                                    myDrum.highScore +
                                    myDrum.myScoreboard.scoreboardStrings.MATCHES,
                                    "center"
                                );

                            myDrum.newScoreboardDisplay[4] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                                    theDrumObjThis.offset,
                                    "left"
                                );

                            myDrum.newScoreboardDisplay[5] =
                                myDrum.myScoreboard.justifyLine(
                                    myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                                    Math.round(theDrumObjThis.averageError,1) + " " +
                                    myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                                    "center"
                                );

                            myDrum.newScoreboardDisplay[7] = myDrum.myScoreboard.getScoreboardBorder();

                            // Update scoreboard display!
                            myDrum.myScoreboard.updateScoreboard(
                                myDrum.newScoreboardDisplay,
                                myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR
                            );
                        }

                        // Display High Score for a few seconds before resetting
                        Script.setTimeout(function () {
                            myDrum.myScoreboard.updateScoreboard(
                                myDrum.myScoreboard.getScoreboardGreeting(),
                                myDrum.myScoreboard.GREETING_TEXT_COLOR
                                );
                        }, myDrum.SCOREBOARD_RESET_DELAY);

                        return;
                    }

                    // Play beat!
                    myDrum.soundInjector = Audio.playSound(myDrum.beatSound, myDrum.beatSoundOptions);

                    // Update audio position with position of entity
                    myDrum.beatSoundOptions.position = Entities.getEntityProperties(myDrum.entityID).position;

                    // Count beat
                    myDrum.beatCounter++;

                    // pulse color to red on beat
                    Entities.editEntity(myDrum.entityID, myDrum.UNCLICKED_BEAT_TEXT_COLOR);

                    // Reset to starting color after beat
                    myDrum.colorResetTimeoutID = Script.setTimeout(function () {
                        Entities.editEntity(myDrum.entityID, myDrum.startingColor);
                    }, myDrum.getIntervalFromBpm(myDrum.BPM) / 4);

                    // Check if beat was attempted, as ****UNCLICKED BEATS COUNT AS MISSES****
                    if (!myDrum.beatAttempted) {
                        myDrum.beatsMissed++;

                        // Build new scoreboard display - unclicked beat
                        myDrum.newScoreboardDisplay = myDrum.myScoreboard.getNewScoreboardDisplay();

                        myDrum.newScoreboardDisplay[0] =
                            myDrum.myScoreboard.justifyLine(
                                myDrum.myScoreboard.scoreboardStrings.BEATS_PLAYED + myDrum.beatCounter,
                                "center"
                            );

                        myDrum.newScoreboardDisplay[2] =
                            myDrum.myScoreboard.justifyLine(
                                myDrum.myScoreboard.scoreboardStrings.BEATS_MATCHED + myDrum.beatsMatched,
                                "center"
                            );

                        myDrum.newScoreboardDisplay[3] =
                            myDrum.myScoreboard.justifyLine(
                                myDrum.myScoreboard.scoreboardStrings.BEATS_MISSED + myDrum.beatsMissed,
                                "center"
                            );

                        // Update scoreboard display!
                        myDrum.myScoreboard.updateScoreboard(
                            myDrum.newScoreboardDisplay,
                            myDrum.myScoreboard.UNCLICKED_BEAT_TEXT_COLOR
                        );
                    }

                    myDrum.beatAttempted = false;
                }

            }, myDrum.BPM_CHECK_HEARTBEAT_INTERVAL);

        },
        // :::: Stop Beat ::::
        stopBeat: function() {

            // print("-----STOPPING BEAT-----");


            // Play Game Over sound!
            myDrum.soundInjector = Audio.playSound(
                myDrum.gameOverSound, myDrum.gameOverSoundOptions);

            // Reset Scoreboard to greeting
            myDrum.myScoreboard.updateScoreboard(
                myDrum.myScoreboard.getScoreboardGreeting,
                myDrum.myScoreboard.GREETING_TEXT_COLOR
            );

            // Reset Intervals
            Script.clearInterval(myDrum.beatIntervalID);

            // Reset Timeout
            Script.clearTimeout(myDrum.colorResetTimeoutID);

            // Reset color to starting color
            Entities.editEntity(myDrum.entityID, myDrum.startingColor);

            // Reset beat counter
            myDrum.beatCounter = 0;

            // Reset checks
            myDrum.hasBeatStarted = false;
            myDrum.beatAttempted = false;

            // turn off heartbeat
            this.shouldCheckTime = false;

        },
        // Check Drum hit
        checkDrumHit: function(){

            // print("|||| CHECKING DRUM HIT ||||");


            myDrum.beatAttempted = true;
            myDrum.timeAtStartOfHit = new Date();

            // Get time difference from start of beat to drum hit
            myDrum.hitTimeAfterBeat = myDrum.timeAtStartOfHit - myDrum.timeAtStartOfBeat;

            theDrumObjThis.offset = (theDrumObjThis.hitTimeAfterBeat < theDrumObjThis.getIntervalFromBpm(myDrum.BPM)/2) ?
                (theDrumObjThis.hitTimeAfterBeat * -1) :
                theDrumObjThis.getIntervalFromBpm(myDrum.BPM) - theDrumObjThis.hitTimeAfterBeat;

            //  show trailing average of last 20 errors or so
            theDrumObjThis.averageError = 0.05 * Math.abs(theDrumObjThis.offset) + 0.95 * theDrumObjThis.averageError;

            // hit within after beat range
            if(myDrum.hitTimeAfterBeat <=
                (myDrum.getIntervalFromBpm(myDrum.BPM) -
                (myDrum.getIntervalFromBpm(myDrum.BPM)/4) )){

                // beat was a match
                this.matchBeat();
            }

            // hit within miss range
            if(myDrum.hitTimeAfterBeat >
                (myDrum.getIntervalFromBpm(myDrum.BPM) -
                (myDrum.getIntervalFromBpm(myDrum.BPM)/4) )) {

                // beat was a miss
                this.missBeat();
            }

            // Reset to starting color after hit
            myDrum.colorResetTimeoutID = Script.setTimeout(function () {
                Entities.editEntity(myDrum.entityID, myDrum.startingColor);
            }, myDrum.getIntervalFromBpm(myDrum.BPM) / 4);
        },
        matchBeat: function(){

            // print("OOOO MATCHED BEAT 0000");

            myDrum.beatsMatched++;

            // pulse color to theDrumObjthis.match Green on match
            Entities.editEntity(myDrum.entityID, myDrum.matchColor);

            myDrum.newScoreboardDisplay = myDrum.myScoreboard.getNewScoreboardDisplay();

            // Build new scoreboard display - display random match scoreboard message
            myDrum.newScoreboardDisplay[0] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.BEATS_PLAYED + myDrum.beatCounter,
                    "center"
                );

            myDrum.newScoreboardDisplay[1] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardMatchResponseList[
                        myDrum.getRandomInt(0, myDrum.myScoreboard.scoreboardMatchResponseList.length -1)],
                    "center"
                );

            myDrum.newScoreboardDisplay[2] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.BEATS_MATCHED + myDrum.beatsMatched, "center"
                );

            myDrum.newScoreboardDisplay[3] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.BEATS_MISSED + myDrum.beatsMissed, " center"
                );

            myDrum.newScoreboardDisplay[5] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                    theDrumObjThis.offset,
                    "center"
                );

            myDrum.newScoreboardDisplay[6] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                    Math.round(theDrumObjThis.averageError,1) + " " +
                    myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                    "center"
                );

            // Update scoreboard display!
            myDrum.myScoreboard.updateScoreboard(
                myDrum.newScoreboardDisplay,
                myDrum.myScoreboard.MATCHED_BEAT_TEXT_COLOR
            );

        },
        missBeat: function(){

            // print("QQQQQQQQQ MMISSED BEAT QQQQQQQQ");

            myDrum.beatsMissed++;

            // pulse color to myDrum.missColor on miss
            Entities.editEntity(myDrum.entityID, myDrum.missColor);

            myDrum.newScoreboardDisplay = myDrum.myScoreboard.getNewScoreboardDisplay();

            // Build new scoreboard display - display random miss scoreboard message
            myDrum.newScoreboardDisplay[0] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.BEATS_PLAYED + myDrum.beatCounter, "center");

            myDrum.newScoreboardDisplay[2] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.BEATS_MATCHED + myDrum.beatsMatched, "center");

            myDrum.newScoreboardDisplay[3] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.BEATS_MISSED + myDrum.beatsMissed, "center");

            myDrum.newScoreboardDisplay[4] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardMissResponseList[
                        myDrum.getRandomInt(0, myDrum.myScoreboard.scoreboardMissResponseList.length - 1)],
                    "center"
                );

            myDrum.newScoreboardDisplay[5] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                    theDrumObjThis.offset,
                    "center"
                );

            myDrum.newScoreboardDisplay[6] =
                myDrum.myScoreboard.justifyLine(
                    myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                    Math.round(theDrumObjThis.averageError,1) + " " +
                    myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                    "center"
                );

            // Update scoreboard display!
            myDrum.myScoreboard.updateScoreboard(
                myDrum.newScoreboardDisplay,
                myDrum.myScoreboard.MISSED_BEAT_TEXT_COLOR
            );

        },
        // Preloads a pile of data for myDrum scope
        preload: function(entityID) {

            // set our id so other methods can get it.
            this.entityID = entityID;

            this.entityPosition = Entities.getEntityProperties(this.entityID).position;

            // :: Drum Starting Color ::
            this.startingColor = {  // starting Color on BeatMatcher load/reset
                color: {
                    red: Entities.getEntityProperties(this.entityID).color.red,
                    green: Entities.getEntityProperties(this.entityID).color.green,
                    blue: Entities.getEntityProperties(this.entityID).color.blue
                }
            };

            // :: Sounds ::
            // Beat
            myDrum.beatURL = "http://theblacksun.s3.amazonaws.com/props/beatMatcher/beat_mono.wav";
            myDrum.beatSound = SoundCache.getSound(myDrum.beatURL);
            myDrum.beatSoundOptions =  {
                position: Entities.getEntityProperties(myDrum.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true
            };
            if (!myDrum.beatSound.downloaded){
                print("*****"+myDrum.beatURL+" failed to download!******"); }

            // GameOver
            myDrum.gameOverURL = "http://theblacksun.s3.amazonaws.com/props/beatMatcher/GameOver.wav";
            myDrum.gameOverSound = SoundCache.getSound(myDrum.gameOverURL);
            myDrum.gameOverSoundOptions =  {
                position: Entities.getEntityProperties(myDrum.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true

            };
            if (!myDrum.gameOverSound.downloaded){
                print("*****"+myDrum.gameOverURL+" failed to download!******"); }

            // make rest of BeatMatcher
            myDrum.myScoreboard = new Scoreboard(Vec3.sum(this.entityPosition,{x: 0, y: 0.250, z: -0.05}));
        },
        unload: function(){
            // clear beat timer
            Script.clearInterval(myDrum.beatIntervalID);

            // delete Scoreboard entity and object
            myDrum.myScoreboard.deleteScoreboard();

            // De-register hand controller listener
            Script.update.disconnect(this.checkForHandControllerDrumHit);

        }
    };

    myDrum = new Drum();
    return myDrum;
});