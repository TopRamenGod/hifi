//
//  beatMatcher.js
//
//  Created by Michael 'TopRamenGod' Varner on 2/8/2017
//  Copyright 2017 High Fidelity, Inc.
//
//  This script creates a rhythm practice toy.
//
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function() {

    var Scoreboard = function() {
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
                x: 0.6,
                y: 0.425,
                z: 0.1
            },
            text: theDrumObjThis.scoreboardGreeting,
            lineHeight: 0.05,
            textColor: {red: 255, green: 255, blue: 255},
            backgroundColor: {red: 0, green: 0, blue: 0},
            defaultFaceCamera: true,
            lifetime: -1
        }

        var _scoreboard = Entities.addEntity(scoreboardProperties);

        setScoreboard = function(newTextProperty) {
            Entities.editEntity(_scoreboard, newTextProperty);
            print("Scoreboard text changed to:");
            print(JSON.stringify(Entities.getEntityProperties(_scoreboard).text));
        }
    };

    Drum = function() {

        theDrumObjThis = this;

        this.beatColor = {color: {red: 0, green: 0, blue: 255}};      // Blue
        this.matchColor = {color: {red: 0, green: 255, blue: 0}};     // Green
        this.missColor = {color: {red: 255, green: 128, blue: 0}};    // Dark Orange

        // Match success list - last 10 hits
        this.matchLatencyList = [];

        // Mouse Click Operation
        this.clickDownOnEntity = function(entityID, mouseEvent){
            if (Entities.getEntityProperties(theDrumObjThis.entityID).name == 'BeatMatcher_Drum') {
                theDrumObjThis.hitDrum();
                print("Drum clicked!!!!");
            }
        };

        rightHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_RIGHTHAND");
        leftHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_LEFTHAND");
        var handInRadius = false;

        // Hand Controller Operation
        this.checkForHandControllerDrumHit = function(){

            rightHandControllerOrientation = Quat.multiply(MyAvatar.orientation,
                MyAvatar.getAbsoluteJointRotationInObjectFrame(rightHandControllerJointIndex));
            rightHandControllerPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation,
                MyAvatar.getAbsoluteJointTranslationInObjectFrame(rightHandControllerJointIndex)));

            leftHandControllerOrientation = Quat.multiply(MyAvatar.orientation,
                MyAvatar.getAbsoluteJointRotationInObjectFrame(leftHandControllerJointIndex));
            lefthandControllerPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation,
                MyAvatar.getAbsoluteJointTranslationInObjectFrame(leftHandControllerJointIndex)));

            // right hand distance to drum
            var rightHandDistanceToDrum = Vec3.distance(rightHandControllerPosition,
                Entities.getEntityProperties(theDrumObjThis.entityID).position);
            var leftHandDistanceToDrum = Vec3.distance(lefthandControllerPosition,
                Entities.getEntityProperties(theDrumObjThis.entityID).position);

            if ((rightHandDistanceToDrum <= 0.13 || leftHandDistanceToDrum <= 0.13) && !handInRadius) {
                handInRadius = true;
                print(":::::::::TRIGGER!:::::::::");

                theDrumObjThis.hitDrum();
            }
        };

        // register checkForHandControllerDrumHit callback
        Script.update.connect(this.checkForHandControllerDrumHit);    // This may simply be checking too often

        // Helper functions
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
        this.hitCheckID = Script.setInterval(function(){ handInRadius = false; }, 500);

        // Timing
        this.bpm = 80;
        this.beatCounter = 0;
        this.missLimit = 5;
        this.beatAttempted = false;
        this.hasBeatStarted = false;

        // Matches and Misses
        this.beatsMatched = 0;
        this.beatsMissed = 0;

        // High Score
        this.highScore = 0;

        this.scoreboardRollingGreetingList = [
            "    COME AND BE A \n"+"    BEATMATCH HERO!\n\n",
            "    TEST YOUR SKILLS!\n\n",
            "    ARE YOU A BAD \n"+"    ENOUGH DUDE?\n\n",
            "    WANNA BE AWESOME.... \n"+"    ...ER?\n\n"
        ];

        // Scoreboard messages
        this.scoreboardMatchResponseList = [
            'Beat matched!',
            'Well done!',
            'Awesome!!!',
            'good',
            'GREAT!',
            'Superb!'];
        this.scoreboardMissResponseList = [
            'Beat missed :(',
            'NOPE',
            'fail.',
            'miss.',
            'MISS',
            'You can do better...',
            'try again',
            'hmm...'
        ];

        // Scoreboard Greeting
        this.scoreboardGreeting = "BeatMatcher 5000\n\n"+
            this.scoreboardRollingGreetingList[this.getRandomInt(0, this.scoreboardRollingGreetingList.length -1)]+"\n"+
            "\tHit the white sphere to start!\n";

    };

    Drum.prototype = {

        hitDrum: function(){

            // :::: Start beat ::::
            if(!theDrumObjThis.hasBeatStarted && theDrumObjThis.beatCounter <= 0) {
                print("!!!!!!!!!!!!!!!!!!!!! DOIN THE THING !!!!!!!!!!!!!!!!!!!!!");

                // set timestamp for *first* beat
                theDrumObjThis.futureBeat = Date.now() + theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm);

                theDrumObjThis.hasBeatStarted = true;
                this.shouldCheckTime = true;
                this.startBeat();

                // :::: Check drum hit if already started ::::
            } else if(theDrumObjThis.hasBeatStarted && (theDrumObjThis.beatCounter > 0 &&
                theDrumObjThis.beatsMissed <= theDrumObjThis.missLimit)){

                // :::: Check if Drum hit is beat miss or match ::::
                this.checkDrumHit();
            }
        },
        shouldBeatFire: function(){
            return this.shouldCheckTime && (Date.now() >= this.futureBeat);
        },
        startBeat: function() {

            // Reset matches and misses
            theDrumObjThis.beatsMatched = 0;
            theDrumObjThis.beatsMissed = 0;
            theDrumObjThis.matchLatencyList = [0,0,0,0,0,0,0,0,0,0];    // Start with 0ms avg

            // 60,000 ms / 120 BPM = 500 ms per beat
            // heartBeat interval for checking to see if the right amount of time has passed for a beat to occur
            theDrumObjThis.heartBeatIntervalID = Script.setInterval(function () {

                if(Date.now() >= theDrumObjThis.futureBeat) {

                    // set timestamp for *next* beat
                    theDrumObjThis.futureBeat = Date.now() + theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm);

                    // Trailing matched beat latency list
                    if (theDrumObjThis.matchLatencyList.length > 10) {
                        theDrumObjThis.matchLatencyList.shift();
                    }

                    // print("match latency list: "+theDrumObjThis.matchLatencyList);

                    // Start beat timer
                    theDrumObjThis.timeAtStartOfBeat = new Date();
                    // print("time at start of beat: "+theDrumObjThis.timeAtStartOfBeat);


                    // :::: Stop drum after beatsMissed limit ::::
                    if (theDrumObjThis.beatsMissed >= theDrumObjThis.missLimit) {

                        // Stop beat
                        theDrumObjThis.stopBeat();

                        // Check beats matched against high score
                        if (theDrumObjThis.checkUpdateHighScore(theDrumObjThis.beatsMatched)) {
                            // Display beat high score!
                            setScoreboard({
                                text: "You beat the high score!:\n" +
                                theDrumObjThis.highScore + " Beats Matched!!!\n" +
                                "Average Beat Match Latency:" +
                                "          " + theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) + "ms late" + "\n" +
                                "          GAME OVER"
                            });
                        } else {
                            // Display high Score
                            setScoreboard({
                                text: "          GAME OVER\n" +
                                "          High score: " + theDrumObjThis.highScore + " Beats Matched!!!" +
                                "\n" +
                                "Average Beat Match Latency:" +
                                "          " + theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) + "ms late" + "\n"

                            });
                        }

                        // Display High score for a few seconds before resetting
                        Script.setTimeout(function () {
                            setScoreboard({text: theDrumObjThis.scoreboardGreeting});
                        }, 6000);

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
                    }, theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm) / 4);

                    // Check if beat was attempted, as **unclicked beats count as misses**
                    if (!theDrumObjThis.beatAttempted) {
                        theDrumObjThis.beatsMissed++;

                        // Update Scoreboard
                        setScoreboard({
                            text: "Beats Played: " + theDrumObjThis.beatCounter + "\n" +
                            "\n" +
                            "Beats Matched: " + theDrumObjThis.beatsMatched + "\n" +
                            "Beats Missed: " + theDrumObjThis.beatsMissed + "\n" +
                            "\n" +
                            "Average Beat Match Latency: " + theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList) + "ms late" + "\n" +
                            "Last beat match: " + theDrumObjThis.hitTimeAfterBeat + "ms late..."
                        });
                    }

                    theDrumObjThis.beatAttempted = false;

                }
            }, 5);
        },
        // :::: Stop Beat ::::
        stopBeat: function() {

            // Play Game Over sound!
            theDrumObjThis.soundInjector = Audio.playSound(theDrumObjThis.gameOverSound, theDrumObjThis.gameOverSoundOptions);

            print("::::Stopping beat::::");

            // Reset Scoreboard
            setScoreboard({text: theDrumObjThis.scoreboardGreeting});

            // Reset Intervals
            Script.clearInterval(theDrumObjThis.heartBeatIntervalID);

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
            // print("###### Drum hit!!!! ######");
            theDrumObjThis.beatAttempted = true;

            theDrumObjThis.timeAtStartOfHit = new Date();

            // Get time difference from start of beat to drum hit
            theDrumObjThis.hitTimeAfterBeat = theDrumObjThis.timeAtStartOfHit - theDrumObjThis.timeAtStartOfBeat;

            // hit within after beat range
            if(theDrumObjThis.hitTimeAfterBeat <=
                (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm) - (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm)/4) )){
                this.matchBeat();
            }

            // hit within miss range
            if(theDrumObjThis.hitTimeAfterBeat >
                (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm) - (theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm)/4) )) {
                this.missBeat();
            }

            // Reset to starting color after hit
            theDrumObjThis.colorResetTimeoutID = Script.setTimeout(function () {
                Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.startingColor);
            }, theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm) / 4);
        },
        matchBeat: function(){
            // print("++++++++++Match!!!!!++++++++++");
            theDrumObjThis.beatsMatched++;

            // pulse color to green on match
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.matchColor);

            // Add 1 to match success list
            theDrumObjThis.matchLatencyList.push(theDrumObjThis.hitTimeAfterBeat);

            // print("average match time from beat: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList));

            // Display random match scoreboard message
            setScoreboard({text: "Beats Played: "+theDrumObjThis.beatCounter+"\n"+
                theDrumObjThis.scoreboardMatchResponseList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardMatchResponseList.length -1)]+"\n"+
                "Beats Matched: "+theDrumObjThis.beatsMatched+"\n"+
                "Beats Missed: "+theDrumObjThis.beatsMissed+"\n"+
                "\n"+
                "Average Beat Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
                "Last beat match: "+theDrumObjThis.hitTimeAfterBeat+"ms late..."});
        },
        missBeat: function(){

            // print("-----------miss!!!----------");
            theDrumObjThis.beatsMissed++;

            // play miss sound!
            // theDrumObjThis.soundInjector = Audio.playSound(theDrumObjThis.missSound, theDrumObjThis.missSoundOptions);

            // pulse color to orange on miss will be moved to missBeat
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.missColor);

            // Display random match scoreboard message
            setScoreboard({text: "Beats Played: "+theDrumObjThis.beatCounter+"\n"+
                "\n"+
                "Beats Matched: "+theDrumObjThis.beatsMatched+"\n"+
                "Beats Missed: "+theDrumObjThis.beatsMissed+"\n"+
                theDrumObjThis.scoreboardMissResponseList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardMissResponseList.length -1)]+"\n"+
                "Average Beat Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
                "Last beat match: "+theDrumObjThis.hitTimeAfterBeat+"ms late..."});

        },
        // preloads a pile of data for theDrumObjThis scope
        preload: function(entityID) {
            print("preload(" + entityID + ")");

            // set our id so other methods can get it.
            this.entityID = entityID;

            this.entityPosition = Entities.getEntityProperties(this.entityID).position;

            // Drum Colors
            this.startingColor = {  // Starting Color on BeatMatcher load/reset
                color: {
                    red: Entities.getEntityProperties(this.entityID).color.red,
                    green: Entities.getEntityProperties(this.entityID).color.green,
                    blue: Entities.getEntityProperties(this.entityID).color.blue
                }
            };

            // Sounds
            //// Beat
            theDrumObjThis.beatURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/beat_mono.wav';
            theDrumObjThis.beatSound = SoundCache.getSound(theDrumObjThis.beatURL);
            theDrumObjThis.beatSoundOptions =  {
                position: Entities.getEntityProperties(theDrumObjThis.entityID).position, // Probably just define this inside of the BeatMatcher prototype
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true
            };
            if (!theDrumObjThis.beatSound.downloaded){ print("*****"+theDrumObjThis.beatURL+" failed to download!******"); }

            // Disabled for latency reasons
            //// Miss
            // theDrumObjThis.missURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/miss_04.wav';
            // theDrumObjThis.missSound = SoundCache.getSound(theDrumObjThis.missURL);
            // theDrumObjThis.missSoundOptions =  {
            //     position: Entities.getEntityProperties(theDrumObjThis.entityID).position,
            //     volume: 0.45,
            //     loop: false,
            //     stereo: false,
            //     localOnly: true
            //
            // };
            // if (!theDrumObjThis.missSound.downloaded){ print("*****"+theDrumObjThis.missURL+" failed to download!******"); }

            //// GameOver
            theDrumObjThis.gameOverURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/GameOver.wav';
            theDrumObjThis.gameOverSound = SoundCache.getSound(theDrumObjThis.gameOverURL);
            theDrumObjThis.gameOverSoundOptions =  {
                position: Entities.getEntityProperties(theDrumObjThis.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true

            };
            if (!theDrumObjThis.gameOverSound.downloaded){ print("*****"+theDrumObjThis.gameOverURL+" failed to download!******"); }

            // make rest of BeatMatcher
            new Scoreboard();
        },
        unload: function(){
            clearInterval(this.hitCheckID);
            clearInterval(this.heartBeatIntervalID);
        }
    };

    return new Drum();
});