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

    var theDrumObjThis = this;

    // Helper functions
    theDrumObjThis.getIntervalFromBpm = function(bpm){ return 60000 / bpm; };

    theDrumObjThis.getRandomInt = function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

    // Update high score if high score beaten
    theDrumObjThis.checkUpdateHighScore = function(currentScore){
        if(currentScore > theDrumObjThis.highScore){
            theDrumObjThis.highScore = currentScore;
            return true;
        } else {
            return false;
        }
    };

    theDrumObjThis.getAverageFromList = function(list){
        var sum = list.reduce(function(acc, val) { return acc + val; }, 0);
        return Math.floor(sum/list.length); // The player probably doesn't care about precision to the millionth of a second
    };

    rightHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_RIGHTHAND");
    leftHandControllerJointIndex = MyAvatar.getJointIndex("_CAMERA_RELATIVE_CONTROLLER_LEFTHAND");
    var handInRadius = false;

    // Mouse Click Operation
    theDrumObjThis.clickDownOnEntity = function(entityID, mouseEvent){
        if (Entities.getEntityProperties(theDrumObjThis.entityID).name == 'BeatMatcher_Drum') {
            Drum.prototype.hitDrum();
            print("Drum clicked!!!!");
        }
    };

    // Hand Controller Operation
    theDrumObjThis.checkForHandControllerDrumHit = function(){

        rightHandControllerOrientation = Quat.multiply(MyAvatar.orientation, MyAvatar.getAbsoluteJointRotationInObjectFrame(rightHandControllerJointIndex));
        rightHandControllerPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, MyAvatar.getAbsoluteJointTranslationInObjectFrame(rightHandControllerJointIndex)));

        leftHandControllerOrientation = Quat.multiply(MyAvatar.orientation, MyAvatar.getAbsoluteJointRotationInObjectFrame(leftHandControllerJointIndex));
        lefthandControllerPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, MyAvatar.getAbsoluteJointTranslationInObjectFrame(leftHandControllerJointIndex)));

        // right hand distance to drum
        var rightHandDistanceToDrum = Vec3.distance(rightHandControllerPosition, Entities.getEntityProperties(theDrumObjThis.entityID).position);
        var leftHandDistanceToDrum = Vec3.distance(lefthandControllerPosition, Entities.getEntityProperties(theDrumObjThis.entityID).position);

        if ((rightHandDistanceToDrum <= 0.13 || leftHandDistanceToDrum <= 0.13) && !handInRadius) {
            handInRadius = true;
            print(":::::::::TRIGGER!:::::::::");
            Drum.prototype.hitDrum();
        }
    };

    // register checkForHandControllerDrumHit callback
    Script.update.connect(theDrumObjThis.checkForHandControllerDrumHit);    // This may simply be checking too often

    // Throttle hit detection
    theDrumObjThis.hitCheckID = Script.setInterval(function(){ handInRadius = false; }, 250);

    // preloads a pile of data for theDrumObjThis scope
    theDrumObjThis.preload = function(entityID) {
        print("preload(" + entityID + ")");

        // set our id so other methods can get it.
        theDrumObjThis.entityID = entityID;
        theDrumObjThis.entityPosition = Entities.getEntityProperties(theDrumObjThis.entityID).position;

        // Colors
        theDrumObjThis.startingColorObject = Entities.getEntityProperties(theDrumObjThis.entityID).color;   // Starting Color on load
        theDrumObjThis.startingColor = {                                                                    // Starting Color on BeatMatcher reset
            color: {
                red: theDrumObjThis.startingColorObject.red,
                green: theDrumObjThis.startingColorObject.green,
                blue: theDrumObjThis.startingColorObject.blue
            }
        };
        theDrumObjThis.beatColor = {color: {red: 0, green: 0, blue: 255}};      // Blue
        theDrumObjThis.matchColor = {color: {red: 0, green: 255, blue: 0}};     // Green
        theDrumObjThis.missColor = {color: {red: 255, green: 128, blue: 0}};    // Dark Orange

        // Sounds
        //// Beat
        theDrumObjThis.beatURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/beat_mono.wav';
        theDrumObjThis.beatSound = SoundCache.getSound(theDrumObjThis.beatURL);   // TODO: condition for Sound.hasDownloaded()
        theDrumObjThis.beatSoundOptions =  {
            position: Entities.getEntityProperties(theDrumObjThis.entityID).position, // Probably just define this inside of the BeatMatcher prototype
            volume: 0.3,
            loop: false,
            stereo: false
        };

        //// Miss
        theDrumObjThis.missURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/miss_04.wav';
        theDrumObjThis.missSound = SoundCache.getSound(theDrumObjThis.missURL);   // TODO: condition for Sound.hasDownloaded()
        theDrumObjThis.missSoundOptions =  {
            position: Entities.getEntityProperties(theDrumObjThis.entityID).position,
            volume: 0.3,
            loop: false,
            stereo: true
        };

        //// GameOver
        theDrumObjThis.gameOverURL = 'http://theblacksun.s3.amazonaws.com/props/beatMatcher/GameOver.wav';
        theDrumObjThis.gameOverSound = SoundCache.getSound(theDrumObjThis.gameOverURL);   // TODO: condition for Sound.hasDownloaded()
        theDrumObjThis.gameOverSoundOptions =  {
            position: Entities.getEntityProperties(theDrumObjThis.entityID).position,
            volume: 0.3,
            loop: false,
            stereo: true
        };

        theDrumObjThis.hasBeatStarted = false;

        // Timing
        theDrumObjThis.bpm = 100;
        theDrumObjThis.beatCounter = 0;
        theDrumObjThis.matchTimer = 0;
        theDrumObjThis.missLimit = 5;
        theDrumObjThis.beatAttempted = false;

        // Matches and Misses
        theDrumObjThis.beatsMatched = 0;
        theDrumObjThis.beatsMissed = 0;

        // High Score
        theDrumObjThis.highScore = 0;

        // Match success list - last 10 hits
        theDrumObjThis.matchSuccessList = [];
        theDrumObjThis.matchLatencyList = [];

        theDrumObjThis.scoreboardRollingGreetingList = [
            "    COME AND BE A \n"+"    BEATMATCH HERO!\n\n",
            "    TEST YOUR SKILLS!\n\n",
            "    ARE YOU A BAD \n"+"    ENOUGH DUDE?\n\n",
            "    WANNA BE AWESOME.... \n"+"    ...ER?\n\n"
        ];

        // Scoreboard messages
        theDrumObjThis.scoreboardCongratsResponseList = [
            'You beat the high score!!!',
            'YOUR NAME SHALL BE SUNG IN THE HALLS OF VALHALLA'];
        theDrumObjThis.scoreboardTimeoutResponseList = [
            'Time\'s up!',
            '5 missed beats in a row....',
            'That could have gone better...'];
        theDrumObjThis.scoreboardMatchResponseList = [
            'Beat matched!',
            'Well done!',
            'Awesome!!!',
            'good',
            'GREAT!',
            'Superb!'];
        theDrumObjThis.scoreboardMissResponseList = [
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
        theDrumObjThis.scoreboardGreeting = "BeatMatcher 5000\n\n"+
            theDrumObjThis.scoreboardRollingGreetingList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardRollingGreetingList.length -1)]+"\n"+
            "\tHit the white sphere to start!\n";

        // make rest of BeatMatcher
        // new Scoreboard();
        Scoreboard();
    };


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
        }
    };

    function Drum() {}

    Drum.prototype = {

        bpm: theDrumObjThis.bpm,

        hitDrum: function(){

            // :::: Start beat ::::
            if(!theDrumObjThis.hasBeatStarted && theDrumObjThis.beatCounter <= 0) {

                theDrumObjThis.hasBeatStarted = true;
                this.startBeat();

                // :::: Check drum hit if already started ::::
            } else if(theDrumObjThis.hasBeatStarted && (theDrumObjThis.beatCounter > 0 && theDrumObjThis.beatsMissed <= theDrumObjThis.missLimit)){

                // :::: Check if Drum hit is beat miss or match ::::
                this.checkDrumHit();
            }
        },
        startBeat: function() {

            // Reset matches and misses
            theDrumObjThis.beatsMatched = 0;
            theDrumObjThis.beatsMissed = 0;
            theDrumObjThis.matchSuccessList = [1,1,1,1,1,1,1,1,1,1];    // Start with 100%
            theDrumObjThis.matchLatencyList = [0,0,0,0,0,0,0,0,0,0];    // Start with 0ms avg


            // 60,000 ms / 120 BPM = 500 ms per beat
            // Sound files are allowed to play uninterrupted in their entirety. Is there a Play.OneShot() method like Unity that
            // allows for multiple triggers of the same audio clip while they are still playing?
            theDrumObjThis.beatIntervalID = Script.setInterval(function () {

                // Trailing matched beat list -- start at '100%'
                if(theDrumObjThis.matchSuccessList.length > 10){
                    theDrumObjThis.matchSuccessList.shift();
                }
                // Trailing matched beat latency list
                if(theDrumObjThis.matchLatencyList.length > 10){
                    theDrumObjThis.matchLatencyList.shift();
                }

                print("match success list: "+theDrumObjThis.matchSuccessList);
                print("match latency list: "+theDrumObjThis.matchLatencyList);

                // Start beat timer
                theDrumObjThis.timeAtStartOfBeat = new Date();
                print("time at start of beat: "+theDrumObjThis.timeAtStartOfBeat);

                // Update audio position with position of entity
                // TODO: Should probably have this follow the update loop, rather than per beat
                theDrumObjThis.beatSoundOptions.position = Entities.getEntityProperties(theDrumObjThis.entityID).position;

                // :::: Stop drum after beatsMissed limit ::::
                if(theDrumObjThis.beatsMissed >= theDrumObjThis.missLimit){
                    print("You missed too many beats!!!!!!");


                    // Stop beat
                    Drum.prototype.stopBeat();  //// <- Apparently this is the correct way to references these functions
                                                //// in the function prototypes

                    // Check beats matched against high score
                    if(theDrumObjThis.checkUpdateHighScore(theDrumObjThis.beatsMatched)){
                        // Display beat high score!
                        setScoreboard({text: "You beat the high score!:\n"+
                        theDrumObjThis.highScore+" Beats Matched!!!!\n"+
                        "Average Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
                        // "Accuracy: "+((theDrumObjThis.beatsMatched/theDrumObjThis.beatCounter)*100)+"%"+
                        "          GAME OVER"});
                    } else {
                        // Display high Score
                        setScoreboard({
                            text: "          GAME OVER\n"
                            +"          High score!:" +
                            "\n" +
                            "Average Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
                            // "Accuracy: "+((theDrumObjThis.beatsMatched/theDrumObjThis.beatCounter)*100)+"%"+
                            theDrumObjThis.highScore + " Beats Matched!!!!"
                        });
                    }

                    // Display High score for a few seconds before resetting
                    Script.setTimeout(function(){
                        setScoreboard({text: theDrumObjThis.scoreboardGreeting});
                    }, 6000);

                    return;
                }

                // Play beat!
                theDrumObjThis.soundInjector = Audio.playSound(theDrumObjThis.beatSound, theDrumObjThis.beatSoundOptions);
                print("Beat played!");

                // Count beat
                theDrumObjThis.beatCounter++;

                // print("beats played: " + theDrumObjThis.beatCounter);

                // pulse color to red on beat
                Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.beatColor);

                // Reset to starting color after beat
                theDrumObjThis.colorResetTimeoutID = Script.setTimeout(function () {
                    Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.startingColor);
                }, theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm) / 4);

                // Check if beat was attempted, as unclicked beats count as misses
                if(!theDrumObjThis.beatAttempted){
                    print("UNCLICKED BEAT!!!!");
                    theDrumObjThis.beatsMissed++;
                    theDrumObjThis.matchSuccessList.push(0);

                    // Update Scoreboard TODO: Count unclicked beats as misses, then remove this scoreboard update from startBeat
                    setScoreboard({text: "Beats Played: "+theDrumObjThis.beatCounter+"\n"+
                    "\n"+
                    "Beats Matched: "+theDrumObjThis.beatsMatched+"\n"+
                    "Beats Missed: "+theDrumObjThis.beatsMissed+"\n"+
                    "\n"+
                    "Average Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
                    "Last beat match: "+theDrumObjThis.hitTimeAfterBeat+"ms late..."});
                }

                theDrumObjThis.beatAttempted = false;

            }, theDrumObjThis.getIntervalFromBpm(theDrumObjThis.bpm));
        },
        // :::: Stop Beat ::::
        stopBeat: function() {

            // Play Game Over sound!
            theDrumObjThis.soundInjector = Audio.playSound(theDrumObjThis.gameOverSound, theDrumObjThis.gameOverSoundOptions);

            print("::::Stopping beat::::");

            // Reset Scoreboard
            setScoreboard({text: theDrumObjThis.scoreboardGreeting});

            // Reset Intervals
            Script.clearInterval(theDrumObjThis.beatIntervalID);

            // Reset Timeout
            Script.clearTimeout(theDrumObjThis.colorResetTimeoutID);

            // Reset color to starting color
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.startingColor);

            // Reset beat counter
            theDrumObjThis.beatCounter = 0;

            theDrumObjThis.hasBeatStarted = false;
            theDrumObjThis.beatAttempted = false;

        },
        // Check Drum hit
        checkDrumHit: function(){
            print("###### Drum hit!!!! ######");
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
            print("++++++++++Match!!!!!++++++++++");
            theDrumObjThis.beatsMatched++;

            // print("MATCH!"+theDrumObjThis.scoreboardMatchResponseList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardMatchResponseList.length -1)]);

            // pulse color to green on match will be moved to missBeat
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.matchColor);

            // Add 1 to match success list
            theDrumObjThis.matchSuccessList.push(1);
            theDrumObjThis.matchLatencyList.push(theDrumObjThis.hitTimeAfterBeat);

            // print("average match time from beat: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList));

            // Display random match scoreboard message
            setScoreboard({text: "Beats Played: "+theDrumObjThis.beatCounter+"\n"+
            theDrumObjThis.scoreboardMatchResponseList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardMatchResponseList.length -1)]+"\n"+
            "Beats Matched: "+theDrumObjThis.beatsMatched+"\n"+
            "Beats Missed: "+theDrumObjThis.beatsMissed+"\n"+
            "\n"+
            "Average Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
            "Last beat match: "+theDrumObjThis.hitTimeAfterBeat+"ms late..."});
        },
        missBeat: function(){

            print("-----------miss!!!----------");
            theDrumObjThis.beatsMissed++;

            // print("MISS!!"+theDrumObjThis.scoreboardMissResponseList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardMissResponseList.length -1)]);

            // play miss sound!
            theDrumObjThis.soundInjector = Audio.playSound(theDrumObjThis.beatSound, theDrumObjThis.beatSoundOptions);

            // pulse color to orange on miss will be moved to missBeat
            Entities.editEntity(theDrumObjThis.entityID, theDrumObjThis.missColor);

            // Display random match scoreboard message
            setScoreboard({text: "Beats Played: "+theDrumObjThis.beatCounter+"\n"+
            "\n"+
            "Beats Matched: "+theDrumObjThis.beatsMatched+"\n"+
            "Beats Missed: "+theDrumObjThis.beatsMissed+"\n"+
            theDrumObjThis.scoreboardMissResponseList[theDrumObjThis.getRandomInt(0, theDrumObjThis.scoreboardMissResponseList.length -1)]+"\n"+
            "Average Match Latency: "+theDrumObjThis.getAverageFromList(theDrumObjThis.matchLatencyList)+"ms late"+"\n"+
            "Last beat match: "+theDrumObjThis.hitTimeAfterBeat+"ms late..."});

            // Add 0 to match success list
            theDrumObjThis.matchSuccessList.push(0);
        }
    };
});