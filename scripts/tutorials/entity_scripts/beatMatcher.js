/*
*  beatMatcher.js
*
*  Created by Michael 'TopRamenGod' Varner on 02-FEB-2017
*  Copyright 2017 High Fidelity, Inc.
*
*  This entity script adds the remaining entities and handles the logic for a rhythm practice toy,
*  created with createBeatMatcher.js
*
*
*  "Hit the Drum to start by either clicking it with your mouse, or hit with your avatar's hands. Hit the drum in time
*  with the beat to practice your rhythm! How many beats can you stay in time with?
*
*  Are you a BeatMatch Hero?"
*
*
*
*  The general internal flow of this current iteration is to use a Date comparision as points in actual time for our BPM
*  rhythm (theDrumObjThis.futureBeat), and a rapid 5 ms 'heartbeat' style setInterval timer to frequently check if it is
*  time for the *next* beat in time to fire (theDrumObjThis.beatIntervalID). This is an attempt to counter the inherent
*  unreliability of Javascript timers.
*
*  For hand controller detection, since there are no default colliders for avatar hands, frequent checks against a distance
*  threshold serves this purpose (Drum.checkForHandControllerDrumHit) by being registered with the Script.update method.
*  However, since this method checks TOO frequently (60 Hz) and ends up registering unintentional drum hits, it is
*  throttled (Drum.hitCheckID).
*
*  Distributed under the Apache License, Version 2.0.
*  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

(function() {

    // Displays accuracy, score, and various messages
    var Scoreboard = function() {

        // For clearer scope
        theScoreboardObjThis = this;

        var scoreboardProperties = {
            position: Vec3.sum(Vec3.sum(MyAvatar.position, {
                x: 0,
                y: 0.8375,
                z: -0.05
            }), Vec3.multiply(1, Quat.getFront(Camera.getOrientation()))),
            type: 'Text',
            name: 'BeatMatcher_Scoreboard',
            parentID: theDrumObjThis.entityID,
            dimensions: {
                x: 0.61,
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


        //// TEMPORARILY DISABLED FOR NEW DISPLAY OBJECT
        this.scoreboardRollingGreetingList = [
            "    COME AND BE A \n"+"    BEATMATCH HERO!\n\n",
            "    TEST YOUR SKILLS!\n\n",
            "    ARE YOU A BAD \n"+"    ENOUGH DUDE?\n\n",
            "    WANNA BE AWESOME.... \n"+"    ...ER?\n\n"
        ]

        // :: Scoreboard messages ::
        this.scoreboardMatchResponseList = [
            "Beat matched!",
            "Well done!",
            "Awesome!!!",
            "good",
            "GREAT!",
            "Superb!"
        ];
        this.scoreboardMissResponseList = [
            "Beat missed :(",
            "NOPE",
            "fail.",
            "miss.",
            "MISS",
            "You can do better...",
            "try again",
            "hmm..."
        ];
        this.scoreboardStrings = {
            "BEATMATCHER_NAME": "BeatMatcher 5000",
            "START_1": "Hit/click the",
            "START_2": "sphere to start!",
            "GAME_OVER": "GAME OVER",
            "TIME_LATE": " ms late",
            "HIGH_SCORE": "High Score: ",
            "NEW_HIGH_SCORE": "New high score!: ",
            "BEAT_HIGH_SCORE": "You beat the high score!",
            "AVERAGE_BEATMATCH_LATENCY": "Avg. Match Latency: ",
            "BEATS_MATCHED": "Beats Matched: ",
            "BEATS_MISSED": "Beats Missed: ",
            "BEATS_PLAYED": "Beats Played: ",
            "LAST_BEAT_MATCH": "Last match: ",
            "MATCHES": " matches",
            "MATCHES_EXCL": " Matches!!!",
            "HEADER_PADDING": "=",
            "FOOTER_PADDING": "=",
            "LINE_PADDING": " ",

        };

        // Helps keep your lines the length that fit best given text entity dimensions and lineHeight
        // TODO: find a programmatic way to define initial line length by text entity dimensions and lineHeight
        theScoreboardObjThis.REQUIRED_LINE_LENGTH = 25;
        theScoreboardObjThis.NUM_DISPLAY_LINES = 8;

        theScoreboardObjThis.scoreboardGreeting = theScoreboardObjThis.getScoreboardGreeting();

        setScoreboard = function(newTextProperty) {
            Entities.editEntity(theScoreboardObjThis._scoreboard, newTextProperty);
            print("function setScoreboard");

        }

    };

    Scoreboard.prototype = {
        setScoreboard: function(newTextProperty) {
            Entities.editEntity(theScoreboardObjThis._scoreboard, newTextProperty);
            print("prototype setScoreboard");
        },
        repeatString: function(str, n){
            return new Array(n + 1).join(str);
        },
        // returns a scoreboard greeting template of a a new scoreboard display object
        getScoreboardGreeting: function(){
            print("prototype getScoreboardGreeting");

            newScoreboardGreeting = this.getNewScoreboardDisplay();

            // Build new scoreboard display - Game Welcome/Start Screen
            newScoreboardGreeting['0'] =
                "|" + theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.HEADER_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH-2)
                ) + "|";
            newScoreboardGreeting['1'] =
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)
                )+
                theScoreboardObjThis.scoreboardStrings.BEATMATCHER_NAME +
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-1
                );
            newScoreboardGreeting['2'] =
                "|" + theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.FOOTER_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH-2)
                ) + "|";
            newScoreboardGreeting['4'] =
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/4)+2
                )+
                theScoreboardObjThis.scoreboardStrings.START_1+
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/4)
                );
            newScoreboardGreeting['5'] =
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)+2
                )+
                theScoreboardObjThis.scoreboardStrings.START_2+
                theScoreboardObjThis.repeatString(
                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-4
                );

            print("new scoreboard greeting:");
            print(newScoreboardGreeting.join);
            return newScoreboardGreeting;

        },

        // get new, blank display lines object, addressable by line, so we only need update the lines we care about.
        getNewScoreboardDisplay: function() {

            print("::::: getting new scoreboard display :::: ");

            var emptyScoreboardDisplay = {};

            // create NUM_DISPLAY_LINES blank lines
            for(i=0; i < theScoreboardObjThis.NUM_DISPLAY_LINES - 1; i++){
                emptyScoreboardDisplay[i.toString()] =
                    theScoreboardObjThis.repeatString(
                        theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                        Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH)
                );
            }

            return emptyScoreboardDisplay;
        },

        // Takes in scoreboard display object and updates scoreboard entity
        updateScoreboard: function(newScoreboardDisplay){


            print("*****incoming scoreboard to update: ");
            print(newScoreboardDisplay['0']);
            print(newScoreboardDisplay['1']);
            print(newScoreboardDisplay['2']);
            print(newScoreboardDisplay['3']);
            print(newScoreboardDisplay['4']);
            print(newScoreboardDisplay['5']);
            print(newScoreboardDisplay['6']);
            print(newScoreboardDisplay['7']);

            var newScoreboardText = "";
            var lineEditLength = 0;
            var lineEditStartIndex = 0;

            // Concat display object 'lines' into string for text entity.
            Object.keys(newScoreboardDisplay).forEach(function(line){

                // Pad or truncate to guarantee display 'line' length.
                if(newScoreboardDisplay[line].length < theScoreboardObjThis.REQUIRED_LINE_LENGTH){      // pad line
                    print("+++++Padding line!+++++");

                    // get length of padding
                    lineEditLength = theScoreboardObjThis.REQUIRED_LINE_LENGTH - newScoreboardDisplay[line].length;

                    print("lineEditLength: "+ lineEditLength);

                    // get start point of padding
                    lineEditStartIndex = Math.abs(
                        newScoreboardDisplay[line].length - theScoreboardObjThis.REQUIRED_LINE_LENGTH);

                    // add padding to line, with return character
                    newScoreboardDisplay[line] = newScoreboardDisplay[line] +
                            theScoreboardObjThis.repeatString(
                                theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                lineEditLength
                            ) + "\n";

                } else if (newScoreboardDisplay[line] > theScoreboardObjThis.REQUIRED_LINE_LENGTH)      // truncate line
                    print("-----Truncating line!------");

                    // get newly truncated line
                    newScoreboardDisplay[line] = newScoreboardDisplay[line].substring(
                        0, theScoreboardObjThis.REQUIRED_LINE_LENGTH) + "\n";

                print("adding line: ");
                    print("|"+newScoreboardDisplay[line]);

                    // concat each line
                    newScoreboardText = newScoreboardText + newScoreboardDisplay[line];
            })

            print("updatingScoreboard: ");
            print(newScoreboardText);

            // Update scoreboard text entity!
            this.setScoreboard({
                text: newScoreboardText
            });

        },
    };

    Drum = function() {

        // For clearer understanding of scoping
        theDrumObjThis = this;

        // :: Drum State Colors ::
        this.beatColor = {color: {red: 0, green: 0, blue: 255}};      // Blue
        this.matchColor = {color: {red: 0, green: 255, blue: 0}};     // Green
        this.missColor = {color: {red: 255, green: 128, blue: 0}};    // Dark Orange

        // Match success list - last 10 hits
        this.matchLatencyList = [];


        // ::: Mouse Click Operation :::
        this.clickDownOnEntity = function(entityID, mouseEvent){
            if (Entities.getEntityProperties(theDrumObjThis.entityID).name == 'BeatMatcher_Drum') {
                theDrumObjThis.hitDrum();
            }
        };

        rightHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_RIGHTHAND");
        leftHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_LEFTHAND");
        var handInRadius = false;

        // ::: Hand Controller Operation :::
        this.checkForHandControllerDrumHit = function(){

            var rightHandControllerPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation,
                MyAvatar.getAbsoluteJointTranslationInObjectFrame(rightHandControllerJointIndex)));

            var lefthandControllerPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation,
                MyAvatar.getAbsoluteJointTranslationInObjectFrame(leftHandControllerJointIndex)));

            // right hand distance to drum
            var rightHandDistanceToDrum = Vec3.distance(rightHandControllerPosition,
                Entities.getEntityProperties(theDrumObjThis.entityID).position);
            var leftHandDistanceToDrum = Vec3.distance(lefthandControllerPosition,
                Entities.getEntityProperties(theDrumObjThis.entityID).position);

            if ((rightHandDistanceToDrum <= 0.13 || leftHandDistanceToDrum <= 0.13) && !handInRadius) {
                handInRadius = true;

                theDrumObjThis.hitDrum();
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
            return Math.floor(sum / list.length);                     // The player probably doesn't care about precision
        };                                                            // to the millionth of a second

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

        // Throttle hit detection
        this.hitCheckID = Script.setInterval(function(){ handInRadius = false; }, this.HIT_DETECTION_THROTTLE_WINDOW);

        // Timing
        // e.g.: 60,000 ms / 120 BPM = 500 ms per beat. Inherent latency is much more manageable at lower BPMs.
        this.BPM = 80;
        this.MISS_LIMIT = 5;
        this.HIT_DETECTION_THROTTLE_WINDOW = 500;
        this.beatCounter = 0;
        this.beatAttempted = false;
        this.hasBeatStarted = false;

        // Matches and Misses
        this.beatsMatched = 0;
        this.beatsMissed = 0;

        // Scoreboard object
        this.myScoreboard;
        this.newScoreboardDisplay = {};

        // High Score
        this.highScore = 0;

        this.SCOREBOARD_RESET_DELAY = 6000;

    };

    Drum.prototype = {

        hitDrum: function(){

            // :::: Start beat ::::
            if(!theDrumObjThis.hasBeatStarted && theDrumObjThis.beatCounter <= 0) {

                // set timestamp for *first* beat
                theDrumObjThis.futureBeat = Date.now() + theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM);

                theDrumObjThis.hasBeatStarted = true;
                this.shouldCheckTime = true;
                this.startBeat();

            // :::: Check drum hit if already started ::::
            } else if(theDrumObjThis.hasBeatStarted && (theDrumObjThis.beatCounter > 0 &&
                theDrumObjThis.beatsMissed <= theDrumObjThis.MISS_LIMIT)){

                // :::: Check if Drum hit is beat miss or match ::::
                this.checkDrumHit();
            }
        },
        startBeat: function() {     // most of the active game logic happens here

            // Reset matches and misses
            theDrumObjThis.beatsMatched = 0;
            theDrumObjThis.beatsMissed = 0;
            theDrumObjThis.matchLatencyList = [0,0,0,0,0,0,0,0,0,0];    // Start with 0ms avg

            // heartBeat interval for checking to see if the right amount of time has passed for a beat to occur
            theDrumObjThis.beatIntervalID = Script.setInterval(function () {

                if(Date.now() >= theDrumObjThis.futureBeat) {

                    // set timestamp for *next* beat
                    theDrumObjThis.futureBeat = Date.now() + theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM);

                    // Trailing matched beat latency list
                    if (theDrumObjThis.matchLatencyList.length > 10) {      //  magic 10 into CONST
                        theDrumObjThis.matchLatencyList.shift();
                    }

                    // Start beat timer
                    theDrumObjThis.timeAtStartOfBeat = new Date();

                    // :::: Stop drum after beatsMissed limit ::::
                    if (theDrumObjThis.beatsMissed >= theDrumObjThis.MISS_LIMIT) {

                        // Stop beat
                        theDrumObjThis.stopBeat();

                        // Check beats matched against high score
                        if (theDrumObjThis.checkUpdateHighScore(theDrumObjThis.beatsMatched)) {

                            /* scoreboard update operation:
                            * - scoreboardDisplay = getNewScoreboardDisplay // get new, blank display object
                            * - build scoreBoardDisplay by line:
                            *   scoreboardDisplay[1] = //line1 stuff
                            *   scoreboardDisplay[2] = //line2 stuff....etc
                            * - updateScoreboard(scoreboardDisplay) // updates scoreboard!
                            */
                            theDrumObjThis.newScoreboardDisplay = theDrumObjThis.myScoreboard.getNewScoreboardDisplay();

                            // Build new scoreboard display - Game over, beat high score
                            theDrumObjThis.newScoreboardDisplay[0] =
                                "|" + theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.HEADER_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH-2)
                                ) + "|";
                            theDrumObjThis.newScoreboardDisplay[1] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/4)+2
                                ) +
                                theScoreboardObjThis.scoreboardStrings.NEW_HIGH_SCORE+
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/4)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[2] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)+4
                                ) +
                                theDrumObjThis.highScore +
                                theScoreboardObjThis.scoreboardStrings.MATCHES_EXCL +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[4] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/8)+4
                                ) +
                                theScoreboardObjThis.scoreboardStrings.AVERAGE_BEATMATCH_LATENCY +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/8)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[5] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)+4
                                ) +
                                theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) +
                                theScoreboardObjThis.scoreboardStrings.TIME_LATE +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[6] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)+4
                                ) +
                                theScoreboardObjThis.scoreboardStrings.GAME_OVER +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[7] =
                                "|" +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.FOOTER_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH-2)
                                ) + "|";

                            // Update scoreboard display!
                            theScoreboardObjThis.updateScoreboard(theDrumObjThis.newScoreboardDisplay);

                        } else {

                            theDrumObjThis.newScoreboardDisplay = theDrumObjThis.myScoreboard.getNewScoreboardDisplay();

                            // Build new scoreboard display - Game over, did not beat high score
                            theDrumObjThis.newScoreboardDisplay[0] =
                                "|" + theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.HEADER_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH-2)
                                ) + "|";
                            theDrumObjThis.newScoreboardDisplay[1] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)+4
                                )+
                                theScoreboardObjThis.scoreboardStrings.GAME_OVER +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[2] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/6)+2
                                )+
                                theScoreboardObjThis.scoreboardStrings.HIGH_SCORE + theDrumObjThis.highScore +
                                theScoreboardObjThis.scoreboardStrings.MATCHES +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/6)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[4] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/8)+4
                                )+
                                theScoreboardObjThis.scoreboardStrings.AVERAGE_BEATMATCH_LATENCY +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/8)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[5] =
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)+4
                                )+
                                theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) +
                                theScoreboardObjThis.scoreboardStrings.TIME_LATE +
                                theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.LINE_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH/3)-1
                                );
                            theDrumObjThis.newScoreboardDisplay[7] =
                                "|" + theScoreboardObjThis.repeatString(
                                    theScoreboardObjThis.scoreboardStrings.FOOTER_PADDING,
                                    Math.floor(theScoreboardObjThis.REQUIRED_LINE_LENGTH-2)
                                ) + "|";

                            // Update scoreboard display!
                            theScoreboardObjThis.updateScoreboard(theDrumObjThis.newScoreboardDisplay);
                        }

                        // Display High score for a few seconds before resetting
                        Script.setTimeout(function () {
                            theScoreboardObjThis.updateScoreboard(theScoreboardObjThis.getScoreboardGreeting());

                        }, theDrumObjThis.SCOREBOARD_RESET_DELAY);

                        return;
                    }

                    // Play beat!
                    theDrumObjThis.soundInjector = Audio.playSound(theDrumObjThis.beatSound, theDrumObjThis.beatSoundOptions);

                    // Update audio position with position of entity
                    theDrumObjThis.beatSoundOptions.position = Entities.getEntityProperties(theDrumObjThis.entityID).position;

                    // Count beat
                    theDrumObjThis.beatCounter++;

                    // pulse color to red on beat
                    Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.beatColor);

                    // Reset to starting color after beat
                    theDrumObjThis.colorResetTimeoutID = Script.setTimeout(function () {
                        Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.startingColor);
                    }, theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM) / 4);

                    // Check if beat was attempted, as ***unclicked beats count as misses***
                    if (!theDrumObjThis.beatAttempted) {
                        theDrumObjThis.beatsMissed++;

                        // Build new scoreboard display - unclicked beat
                        theDrumObjThis.newScoreboardDisplay = theDrumObjThis.myScoreboard.getNewScoreboardDisplay();

                        theDrumObjThis.newScoreboardDisplay[0] =
                            theScoreboardObjThis.scoreboardStrings.BEATS_PLAYED + theDrumObjThis.beatCounter;
                        theDrumObjThis.newScoreboardDisplay[2] =
                            theScoreboardObjThis.scoreboardStrings.BEATS_MATCHED + theDrumObjThis.beatsMatched;
                        theDrumObjThis.newScoreboardDisplay[3] =
                            theScoreboardObjThis.scoreboardStrings.BEATS_MISSED + theDrumObjThis.beatsMissed;
                        theDrumObjThis.newScoreboardDisplay[5] =
                            theScoreboardObjThis.scoreboardStrings.AVERAGE_BEATMATCH_LATENCY +
                            theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) +
                            theScoreboardObjThis.scoreboardStrings.TIME_LATE;
                        theDrumObjThis.newScoreboardDisplay[6] =
                            theScoreboardObjThis.scoreboardStrings.LAST_BEAT_MATCH +
                            theDrumObjThis.hitTimeAfterBeat +
                            theScoreboardObjThis.scoreboardStrings.TIME_LATE;

                        // Update scoreboard display!
                        theScoreboardObjThis.updateScoreboard(theDrumObjThis.newScoreboardDisplay);
                    }

                    theDrumObjThis.beatAttempted = false;
                }
            }, 5);
        },
        // :::: Stop Beat ::::
        stopBeat: function() {

            // Play Game Over sound!
            theDrumObjThis.soundInjector = Audio.playSound(
                theDrumObjThis.gameOverSound, theDrumObjThis.gameOverSoundOptions);

            // Reset Scoreboard to greeting
            theScoreboardObjThis.updateScoreboard(theScoreboardObjThis.getScoreboardGreeting());

            // Reset Intervals
            Script.clearInterval(theDrumObjThis.beatIntervalID);

            // Reset Timeout
            Script.clearTimeout(theDrumObjThis.colorResetTimeoutID);

            // Reset color to starting color
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.startingColor);

            // Reset beat counter
            theDrumObjThis.beatCounter = 0;

            // Reset checks
            theDrumObjThis.hasBeatStarted = false;
            theDrumObjThis.beatAttempted = false;

            // turn off heartbeat
            this.shouldCheckTime = false;

        },
        // Check Drum hit
        checkDrumHit: function(){

            theDrumObjThis.beatAttempted = true;
            theDrumObjThis.timeAtStartOfHit = new Date();

            // Get time difference from start of beat to drum hit
            theDrumObjThis.hitTimeAfterBeat = theDrumObjThis.timeAtStartOfHit - theDrumObjThis.timeAtStartOfBeat;

            // hit within after beat range
            if(theDrumObjThis.hitTimeAfterBeat <=
                (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM) -
                (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM)/4) )){

                // beat was a match
                this.matchBeat();
            }

            // hit within miss range
            if(theDrumObjThis.hitTimeAfterBeat >
                (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM) -
                (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM)/4) )) {

                // beat was a miss
                this.missBeat();
            }

            // Reset to starting color after hit
            theDrumObjThis.colorResetTimeoutID = Script.setTimeout(function () {
                Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.startingColor);
            }, theDrumObjThis.getIntervalFromBpm(theDrumObjThis.BPM) / 4);
        },
        matchBeat: function(){

            theDrumObjThis.beatsMatched++;

            // pulse color to theDrumObjthis.matchGreen on match
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.matchColor);

            // add 1 to match success list
            theDrumObjThis.matchLatencyList.push(theDrumObjThis.hitTimeAfterBeat);

            theDrumObjThis.newScoreboardDisplay = theDrumObjThis.myScoreboard.getNewScoreboardDisplay();

            // Build new scoreboard display - display random match scoreboard message
            theDrumObjThis.newScoreboardDisplay[0] =
                theScoreboardObjThis.scoreboardStrings.BEATS_PLAYED + theDrumObjThis.beatCounter;
            theDrumObjThis.newScoreboardDisplay[1] =
                theScoreboardObjThis.scoreboardMatchResponseList[theDrumObjThis.getRandomInt(
                    0, theScoreboardObjThis.scoreboardMatchResponseList.length -1)];
            theDrumObjThis.newScoreboardDisplay[2] =
                theScoreboardObjThis.scoreboardStrings.BEATS_MATCHED + theDrumObjThis.beatsMatched;
            theDrumObjThis.newScoreboardDisplay[3] =
                theScoreboardObjThis.scoreboardStrings.BEATS_MISSED + theDrumObjThis.beatsMissed;
            theDrumObjThis.newScoreboardDisplay[5] =
                theScoreboardObjThis.scoreboardStrings.AVERAGE_BEATMATCH_LATENCY +
                theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) +
                theScoreboardObjThis.scoreboardStrings.TIME_LATE;
            theDrumObjThis.newScoreboardDisplay[6] =
                theScoreboardObjThis.scoreboardStrings.LAST_BEAT_MATCH +
                theDrumObjThis.hitTimeAfterBeat +
                theScoreboardObjThis.scoreboardStrings.TIME_LATE;

            // Update scoreboard display!
            theScoreboardObjThis.updateScoreboard(theDrumObjThis.newScoreboardDisplay);
        },
        missBeat: function(){

            theDrumObjThis.beatsMissed++;

            // pulse color to theDrumObjThis.missColor on miss
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.missColor);

            theDrumObjThis.newScoreboardDisplay = theDrumObjThis.myScoreboard.getNewScoreboardDisplay();

            // Build new scoreboard display - display random miss scoreboard message
            theDrumObjThis.newScoreboardDisplay[0] =
                theScoreboardObjThis.scoreboardStrings.BEATS_PLAYED + theDrumObjThis.beatCounter;
            theDrumObjThis.newScoreboardDisplay[2] =
                theScoreboardObjThis.scoreboardStrings.BEATS_MATCHED + theDrumObjThis.beatsMatched;
            theDrumObjThis.newScoreboardDisplay[3] =
                theScoreboardObjThis.scoreboardStrings.BEATS_MISSED + theDrumObjThis.beatsMissed;
            theDrumObjThis.newScoreboardDisplay[4] =
                theScoreboardObjThis.scoreboardMissResponseList[theDrumObjThis.getRandomInt(
                    0, theScoreboardObjThis.scoreboardMissResponseList.length - 1)];
            theDrumObjThis.newScoreboardDisplay[5] =
                theScoreboardObjThis.scoreboardStrings.AVERAGE_BEATMATCH_LATENCY +
                theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) +
                theScoreboardObjThis.scoreboardStrings.TIME_LATE;
            theDrumObjThis.newScoreboardDisplay[6] =
                theScoreboardObjThis.scoreboardStrings.LAST_BEAT_MATCH +
                theDrumObjThis.hitTimeAfterBeat+theScoreboardObjThis.scoreboardStrings.TIME_LATE;

            // Update scoreboard display!
            theScoreboardObjThis.updateScoreboard(theDrumObjThis.newScoreboardDisplay);

        },
        // Preloads a pile of data for theDrumObjThis scope
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
            theDrumObjThis.beatURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/beat_mono.wav';
            theDrumObjThis.beatSound = SoundCache.getSound(theDrumObjThis.beatURL);
            theDrumObjThis.beatSoundOptions =  {
                position: Entities.getEntityProperties(theDrumObjThis.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true
            };
            if (!theDrumObjThis.beatSound.downloaded){
                print("*****"+theDrumObjThis.beatURL+" failed to download!******"); }

            // GameOver
            theDrumObjThis.gameOverURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/GameOver.wav';
            theDrumObjThis.gameOverSound = SoundCache.getSound(theDrumObjThis.gameOverURL);
            theDrumObjThis.gameOverSoundOptions =  {
                position: Entities.getEntityProperties(theDrumObjThis.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true

            };
            if (!theDrumObjThis.gameOverSound.downloaded){
                print("*****"+theDrumObjThis.gameOverURL+" failed to download!******"); }

            // make rest of BeatMatcher
            theDrumObjThis.myScoreboard = new Scoreboard();
        },
        // Clear timers on script death
        unload: function(){
            Script.clearInterval(theDrumObjThis.hitCheckID);
            Script.clearInterval(theDrumObjThis.beatIntervalID);
        }
    };

    return new Drum();
});