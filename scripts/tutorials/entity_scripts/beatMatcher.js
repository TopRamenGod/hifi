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
 * Distributed under the Apache License, Version 2.0.
 * See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
 */


(function() {


    // Displays accuracy, score, and various messages
    var Scoreboard = function(position) {

        // For clearer scope
        var theScoreboardObjThis = this;

        // Set the creator of the scoreboard to place in the userData
        var scoreboardCreator = MyAvatar.sessionUUID;

        var scoreboardProperties = {
            position: position,
            type: "Text",
            name: "BeatMatcher_Scoreboard",
            parentID: myDrum.entityID,
            dimensions: {x: 0.5075, y: 0.425, z: 0.1},
            text: "If you can see this, something is terribly wrong.",
            lineHeight: 0.05,
            textColor: {red: 255, green: 255, blue: 255},
            backgroundColor: {red: 0, green: 0, blue: 0},
            defaultFaceCamera: true,
            lifetime: -1,
            userData: JSON.stringify({
                creatorUUID: scoreboardCreator
            })
        };

        if (myDrum.isDrumCreator(scoreboardCreator)){

            // The Scoreboard entity, use this to pass entityID
            theScoreboardObjThis._scoreboardEntity = Entities.addEntity(scoreboardProperties);

        }

        // :: Scoreboard State Text Colors ::
        theScoreboardObjThis.DEFAULT_TEXT_COLOR = {red: 255, green: 255, blue: 255};            // White
        theScoreboardObjThis.UNCLICKED_BEAT_TEXT_COLOR = {red: 0, green: 0, blue: 255};         // Blue
        theScoreboardObjThis.MATCHED_BEAT_TEXT_COLOR = {red: 212, green: 250, blue: 205};       // Light Green
        theScoreboardObjThis.MISSED_BEAT_TEXT_COLOR = {red: 232, green: 190, blue: 160};        // Light Orange
        theScoreboardObjThis.GREETING_TEXT_COLOR = {red: 0, green: 255, blue: 0};               // Green
        theScoreboardObjThis.TITLE_TEXT_COLOR = {red: 247, green: 255, blue: 0};                // Yellow
        theScoreboardObjThis.YEAR_TEXT_COLOR = {red: 79, green: 192, blue: 240};                // Sky Blue
        theScoreboardObjThis.EASY_HIGH_SCORE_TEXT_COLOR = {red: 0, green: 128, blue: 0};        // Light Green
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
            "You can do better!",
            "try again",
            "hmm..."
        ];
        theScoreboardObjThis.scoreboardStrings = {
            "BEATMATCHER_NAME": "BeatMatcher 5000",
            "EASY_MODE": "Easy mode!",
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
            "LAST_BEAT_ERROR": "Last hit offset: ",
            "AVERAGE_ERROR": "Avg. offset: ",
            "YEAR_LINE": "2017 High Fidelity",
            "EASY_GAME_OVER": "Thanks for playing!"
        };

        // Scoreboard Display Object Dimensions
        // Helps keep your lines the length that fit best given text entity dimensions and lineHeight
        /* TODO: find a programmatic way to define initial line length by text entity dimensions and lineHeight */
        theScoreboardObjThis.REQUIRED_LINE_LENGTH = 22;
        theScoreboardObjThis.NUM_DISPLAY_LINES = 8;

        // slightly offset ScoreboardLines from parent Scoreboard to avoid z-fighting
        // TODO: replace parent Scoreboard text entity with 'invisible' primitive entity of some kind?
        theScoreboardObjThis.SCOREBOARDLINE_Z_POSITION_OFFSET = 0.015;
        theScoreboardObjThis.SCOREBOARDLINE_Y_OFFSET = 0.02;

        theScoreboardObjThis.scoreboardLineEntityIdList = [];

        theScoreboardObjThis.screenType = "";
        theScoreboardObjThis.textColor= {};
    };

    Scoreboard.prototype = {

        // returns a pre-formatted scoreboard title and screen border line
        getScoreboardBorder: function(){
            return myDrum.myScoreboard.scoreboardStrings.BORDER_ENDS +
                myDrum.myScoreboard.repeatString(
                    myDrum.myScoreboard.scoreboardStrings.HEADER_PADDING,
                    myDrum.myScoreboard.REQUIRED_LINE_LENGTH-3
                ) +
                myDrum.myScoreboard.scoreboardStrings.BORDER_ENDS;
        },


        // returns a prepared scoreboard display object template of a scoreboard greeting screen
        getScoreboardGreeting: function(type){

            // Default type parameter
            if (!type){
                type = 'easy';
            }

            // start with pile of  blank text entity properties
            var newScoreboardGreetingLines = this.getRefreshedScoreboardDisplayLineTextProperties();

            // Title Header
            newScoreboardGreetingLines["0"] = {
                text: this.getScoreboardBorder(),
                textColor: myDrum.myScoreboard.GREETING_TEXT_COLOR
            };

            newScoreboardGreetingLines["1"] = {
                text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.BEATMATCHER_NAME, "center"),
                textColor: myDrum.myScoreboard.TITLE_TEXT_COLOR
            };

            newScoreboardGreetingLines["2"] = {
                text: this.getScoreboardBorder(),
                textColor: myDrum.myScoreboard.GREETING_TEXT_COLOR
            };

            // Build new scoreboard greeting display line entity properties - Normal Mode
            if (type === 'normal') {

                newScoreboardGreetingLines["4"] = {
                    text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.START_1, "left"),
                    textColor: myDrum.myScoreboard.UNCLICKED_BEAT_TEXT_COLOR
                };

                newScoreboardGreetingLines["5"]= {
                    text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.START_2, "right"),
                    textColor: myDrum.myScoreboard.UNCLICKED_BEAT_TEXT_COLOR
                };
            // Build new scoreboard greeting display line entity properties - Easy Mode
            } else if (type === 'easy') {

                newScoreboardGreetingLines["3"] = {
                    text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.EASY_MODE, "center"),
                    textColor: myDrum.myScoreboard.EASY_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardGreetingLines["4"] = {
                    text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.START_1, "left"),
                    textColor: myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardGreetingLines["5"] = {
                    text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.START_2, "right"),
                    textColor: myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR
                };

            }

            // Title Footer
            newScoreboardGreetingLines["7"] = {
                text: myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.YEAR_LINE, "center"),
                textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
            };

            return newScoreboardGreetingLines;

        },
        // returns a prepared scoreboard display object template of a scoreboard high score screen
        getScoreboardHighScore: function(type){

            // start with pile of  blank text entity properties
            var newScoreboardHighScoreDisplayLines = this.getRefreshedScoreboardDisplayLineTextProperties();

            // These lines always display on the high score screen
            newScoreboardHighScoreDisplayLines["0"] = {
                text: this.getScoreboardBorder(),
                textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
            };
            newScoreboardHighScoreDisplayLines["7"] = {
                text: this.getScoreboardBorder(),
                textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
            };

            // Build new scoreboard display - Game over, beat high score
            if (type === 'new') {

                newScoreboardHighScoreDisplayLines["1"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.NEW_HIGH_SCORE, "center"),
                    textColor: myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["2"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.highScore + myDrum.myScoreboard.scoreboardStrings.MATCHES_EXCL,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["3"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                            myDrum.offset,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["4"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                            Math.round(myDrum.averageError, 1) + " " +
                            myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["6"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(myDrum.myScoreboard.scoreboardStrings.GAME_OVER, "center"),
                    textColor: myDrum.myScoreboard.GREETING_TEXT_COLOR
                };

            // Build new scoreboard display - Game over, did not beat high score
            } else if (type === 'current') {

                newScoreboardHighScoreDisplayLines["1"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.GAME_OVER,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.GREETING_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["2"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.HIGH_SCORE +
                            myDrum.highScore +
                            myDrum.myScoreboard.scoreboardStrings.MATCHES,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["4"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                            myDrum.offset,
                            "left"
                        ),
                    textColor: myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["5"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                            Math.round(myDrum.averageError,1) + " " +
                            myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR
                };

            // Build new scoreboard display - Easy mode post-game
            } else if (type === 'easy') {

                newScoreboardHighScoreDisplayLines["1"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.EASY_GAME_OVER,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["4"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                            myDrum.offset,
                            "left"
                        ),
                    textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
                };

                newScoreboardHighScoreDisplayLines["5"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                            Math.round(myDrum.averageError,1) + " " +
                            myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
                };
            }
            
            return newScoreboardHighScoreDisplayLines;
        },

        // returns a prepared scoreboard display object template of a scoreboard beat screen
        getScoreboardBeat: function(type){

            var newScoreboardBeatDisplayLines = this.getRefreshedScoreboardDisplayLineTextProperties();

            // These lines always display in the beat screen
            newScoreboardBeatDisplayLines["0"] = {
                text:
                    myDrum.myScoreboard.justifyLine(
                        myDrum.myScoreboard.scoreboardStrings.BEATS_PLAYED + myDrum.beatCounter,
                        "center"
                    ),
                textColor: myDrum.myScoreboard.YEAR_TEXT_COLOR
            };

            newScoreboardBeatDisplayLines["5"] = {
                text:
                    myDrum.myScoreboard.justifyLine(
                        myDrum.myScoreboard.scoreboardStrings.LAST_BEAT_ERROR +
                        myDrum.offset,
                        "center"
                    ),
                textColor: myDrum.myScoreboard.DEFAULT_TEXT_COLOR
            };

            newScoreboardBeatDisplayLines["6"] = {
                text:
                    myDrum.myScoreboard.justifyLine(
                        myDrum.myScoreboard.scoreboardStrings.AVERAGE_ERROR +
                        Math.round(myDrum.averageError,1) + " " +
                        myDrum.myScoreboard.scoreboardStrings.TIME_SCALE,
                        "center"
                    ),
                textColor: myDrum.myScoreboard.DEFAULT_TEXT_COLOR
            };

            // matched screen
            if (type === 'matched'){                // Build new scoreboard display - matched beat

                // display random match scoreboard message
                newScoreboardBeatDisplayLines["1"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardMatchResponseList[
                                myDrum.getRandomInt(0, myDrum.myScoreboard.scoreboardMatchResponseList.length -1)],
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.EASY_HIGH_SCORE_TEXT_COLOR
                };

                newScoreboardBeatDisplayLines["2"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.BEATS_MATCHED + myDrum.beatsMatched, "center"
                        ),
                    textColor: myDrum.myScoreboard.GREETING_TEXT_COLOR
                };

                newScoreboardBeatDisplayLines["3"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.BEATS_MISSED + myDrum.beatsMissed, "center"
                        ),
                    textColor: myDrum.myScoreboard.MISSED_BEAT_TEXT_COLOR
                };
            // missed screen
            } else if (type === 'missed') {         // Build new scoreboard display - missed beat

                newScoreboardBeatDisplayLines["2"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.BEATS_MATCHED + myDrum.beatsMatched, "center"),
                    textColor: myDrum.myScoreboard.MATCHED_BEAT_TEXT_COLOR
                };

                newScoreboardBeatDisplayLines["3"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.BEATS_MISSED + myDrum.beatsMissed, "center"),
                    textColor: myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR
                };

                // display random miss scoreboard message
                newScoreboardBeatDisplayLines["4"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardMissResponseList[
                                myDrum.getRandomInt(0, myDrum.myScoreboard.scoreboardMissResponseList.length - 1)],
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.TITLE_TEXT_COLOR
                };

            // unclicked screen
            } else if (type === 'unclicked') {      // Build new scoreboard display - unclicked beat

                newScoreboardBeatDisplayLines["2"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.BEATS_MATCHED + myDrum.beatsMatched,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.UNCLICKED_BEAT_TEXT_COLOR
                };

                newScoreboardBeatDisplayLines["3"] = {
                    text:
                        myDrum.myScoreboard.justifyLine(
                            myDrum.myScoreboard.scoreboardStrings.BEATS_MISSED + myDrum.beatsMissed,
                            "center"
                        ),
                    textColor: myDrum.myScoreboard.UNCLICKED_BEAT_TEXT_COLOR
                };
            // easy mode matched screen
            } else if (type === 'easymatched') {

                // Custom easy mode matched beat message can go here

            // easy mode missed screen
            } else if (type === 'easymissed') {

                // Custom easy mode missed beat message can go here

            }

            return newScoreboardBeatDisplayLines;

        },
        // returns array of default text properties, sized to the Scoreboard
        getRefreshedScoreboardDisplayLineTextProperties: function(){

            var refreshedScoreboardDisplayLineTextProperties = {};

            // create NUM_DISPLAY_LINES blank padded lines for blank screen
            for (var i = 0; i < myDrum.myScoreboard.NUM_DISPLAY_LINES; i++) {

                // add blank padded line
                refreshedScoreboardDisplayLineTextProperties[i.toString()] = {
                    text: this.getBlankPaddedLine(),
                    textColor: {
                        red: myDrum.myScoreboard.DEFAULT_TEXT_COLOR.red,
                        green: myDrum.myScoreboard.DEFAULT_TEXT_COLOR.green,
                        blue: myDrum.myScoreboard.DEFAULT_TEXT_COLOR.blue
                    }
                };

            }

            return refreshedScoreboardDisplayLineTextProperties;

        },

        // creates new, blank ScoreboardDisplay, addressable by line, so we only need update the lines we care about.
        getNewScoreboardDisplay: function() {

            var newScoreboardLinePosition = {};

            var newScoreboardLineDimensions = {};
            var newScoreboardLineText = "";
            var initialRed = 255;
            var initialGreen = 255;
            var initialBlue = 255;

            var newScoreboardLineTextColor = {};

            // create NUM_DISPLAY_LINES ScoreboardLine text entities and associated empty lines for blank screen
            for (var i = 0; i < myDrum.myScoreboard.NUM_DISPLAY_LINES; i++){

                var newScoreboardLineName = "BeatMatcher_Scoreboard_Line";

                // get position for new ScoreboardLine text entity by offset from myScoreboard position
                newScoreboardLinePosition = {
                    x : Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).position.x,

                    // Depending on how the parent object is added relative to it's origin, this will either be an
                    // addition that builds *up* or a subtraction that builds *down*
                    y : Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).position.y -
                        (
                            i *
                            (Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).dimensions.y /
                            myDrum.myScoreboard.NUM_DISPLAY_LINES)
                        ) + (myDrum.myScoreboard.SCOREBOARDLINE_Y_OFFSET * (myDrum.myScoreboard.NUM_DISPLAY_LINES + 2)),
                        // ),
                    z: Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).position.z +
                        myDrum.myScoreboard.SCOREBOARDLINE_Z_POSITION_OFFSET
                };

                // give new ScoreboardLine's text entity a unique name to see more easily in the Entity List
                newScoreboardLineName = newScoreboardLineName + "_" + i.toString();

                newScoreboardLineDimensions = {
                    x: Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).dimensions.x,

                    // get new ScoreboardLine height from proportional division of Scoreboard height
                    y: (Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).dimensions.y /
                        myDrum.myScoreboard.NUM_DISPLAY_LINES) + myDrum.myScoreboard.SCOREBOARDLINE_Y_OFFSET,
                    z: Entities.getEntityProperties(myDrum.myScoreboard._scoreboardEntity).dimensions.z
                };

                // get ScoreboardDisplay boot message
                newScoreboardLineText = "ScoreboardLine " + i.toString();

                // Gradient effect on initial display line text, because every opportunity for flair
                initialRed = initialRed - 25;
                initialGreen = initialGreen - 25;
                initialBlue = initialBlue - 25;

                newScoreboardLineTextColor = {red: initialRed, green: initialGreen, blue: initialBlue};

                // Create new ScoreboardLine text entity and object and add new ScoreboardLine text Entity to world
                new ScoreboardLine(
                    newScoreboardLinePosition,
                    newScoreboardLineName,
                    newScoreboardLineDimensions,
                    newScoreboardLineText,
                    newScoreboardLineTextColor
                );
            }

            return myDrum.myScoreboard.scoreboardLineEntityIdList;

        },

        // Takes in scoreboard display object and associated text lines and updates all ScoreboardLine text entities
        updateScoreboard: function(updatedScoreboardDisplayLines){

            if (!updatedScoreboardDisplayLines){
                print("No ScoreboardLine entity IDs provided! Cannot update non-existent entity!");
            }

            // combine properties to their associated display line entities and update each one
            for (var i = 0; i < myDrum.myScoreboard.NUM_DISPLAY_LINES; i++) {

                // print("Updating ScoreboardDisplayLine");
                // print("text: " + updatedScoreboardDisplayLines[i.toString()].text);

                // Update scoreboard text entity!
                theScoreboardLineObjThis.setScoreboardDisplayLine(
                    myDrum.myScoreboard.scoreboardDisplay[i.toString()],
                    {
                        text: updatedScoreboardDisplayLines[i.toString()].text,
                        textColor: updatedScoreboardDisplayLines[i.toString()].textColor}

                    );

            }
        },
        getBlankPaddedLine: function(){

            // print("get blank padded line!!!!!!");

            var blankPaddedLine = myDrum.myScoreboard.repeatString(
                   myDrum.myScoreboard.scoreboardStrings.LINE_PADDING,
                   myDrum.myScoreboard.REQUIRED_LINE_LENGTH - 2
               ) + "\n";

            return blankPaddedLine;
        },

        // returns a string that has been repeated n times
        repeatString: function(str, n){
            return new Array(n + 1).join(str);
        },

        // Justify the contents of a line relative to REQUIRED_LINE_LENGTH. Align left, center or right.
        // -- Developer's note: -- This seems to be pointless right now with each line being it's own text entity, as
        // the first line in a text entity seems to consistently truncate all leading whitespace
        justifyLine: function(line, justification){

            // Pad or truncate to guarantee display "line" length.
            if (line.length < myDrum.myScoreboard.REQUIRED_LINE_LENGTH -1){             // pad line if too short

                // get length of padding
                var lineEditLength = myDrum.myScoreboard.REQUIRED_LINE_LENGTH - line.length;

                // Center justify line with LINE_PADDING string
                if (justification === "center") {

                    // add SIDE padding to left and right sides of line, with return character
                    line =
                        myDrum.myScoreboard.repeatString(
                            myDrum.myScoreboard.scoreboardStrings.LINE_PADDING,
                            Math.floor(lineEditLength / 2) + 3
                        ) +
                        line +
                        myDrum.myScoreboard.repeatString(
                            myDrum.myScoreboard.scoreboardStrings.LINE_PADDING,
                            Math.floor(lineEditLength / 2) + 2
                        ) + "\n";
                }

                // RIGHT justify line with LINE_PADDING string
                if (justification === "right") {

                    // get length of padding
                    lineEditLength = myDrum.myScoreboard.REQUIRED_LINE_LENGTH - line.length;

                    // add padding to LEFT side of line, with return character
                    line = myDrum.myScoreboard.repeatString(
                            myDrum.myScoreboard.scoreboardStrings.LINE_PADDING,
                            lineEditLength + 3
                        ) + line + "\n";
                }

                // LEFT justify line with LINE_PADDING string
                if (justification === "left") {

                    // get length of padding
                    lineEditLength = myDrum.myScoreboard.REQUIRED_LINE_LENGTH - line.length;

                    // add padding to RIGHT side of line, with return character
                    line = line +
                        myDrum.myScoreboard.repeatString(
                            myDrum.myScoreboard.scoreboardStrings.LINE_PADDING,
                            lineEditLength + 3
                        ) + "\n";
                }

            } else if (line > myDrum.myScoreboard.REQUIRED_LINE_LENGTH -1) {           // truncate line if too long

                // get newly truncated line
                line = line.substring(
                        0, myDrum.myScoreboard.REQUIRED_LINE_LENGTH) + "\n";
            }

            return line;
        },
        deleteScoreboardLines: function() {
            for (var line in myDrum.myScoreboard.scoreboardDisplay){
                Entities.deleteEntity(myDrum.myScoreboard.scoreboardDisplay[line]);
            }
        },

        deleteScoreboard: function() {
            Entities.deleteEntity(myDrum.myScoreboard._scoreboardEntity);
        }

    };

    var ScoreboardLine = function(position, name, dimensions, text, textColor) {

        // For clearer scope
        theScoreboardLineObjThis = this;

        // get creator of ScoreboardLine to compare against creator of Drum to avoid duplicates from other clients in the domain
        var scoreboardLineCreator = MyAvatar.sessionUUID;

        var scoreboardLineProperties = {
            position: position,
            type: "Text",
            name: name,
            parentID: myDrum.myScoreboard.entityID,
            dimensions: dimensions,
            text: text,
            lineHeight: 0.05,
            textColor: textColor,
            backgroundColor: {red: 0, green: 0, blue: 0},
            defaultFaceCamera: true,
            lifetime: -1,
            userData: JSON.stringify({
                creatorUUID: scoreboardLineCreator
            })
        };

        // check if creator of ScoreboardLine is also creator of Drum
        if (myDrum.isDrumCreator(scoreboardLineCreator)){

            // A ScoreboardLine entity, use this to pass entityID
            var _scoreboardLineEntity = Entities.addEntity(scoreboardLineProperties);

            // Add newly created ScoreboardLine entityID to list for property access
            myDrum.myScoreboard.scoreboardLineEntityIdList.push(_scoreboardLineEntity);

        }
    };

    ScoreboardLine.prototype = {
        setScoreboardDisplayLine: function (scoreboardDisplayLineEntityID,
                                            newTextProperty,
                                            newTextColorProperty) {
            Entities.editEntity(
                scoreboardDisplayLineEntityID,
                newTextProperty,
                newTextColorProperty);
        }
    };

    var Drum = function() {

        // For clearer understanding of scoping
        var theDrumObjThis = this;

        // :: Drum State Colors ::
        this.UNCLICKED_COLOR = {color: {red: 0, green: 0, blue: 255}};      // Blue
        this.MATCH_COLOR = {color: {red: 0, green: 255, blue: 0}};          // Green
        this.MISS_COLOR = {color: {red: 255, green: 128, blue: 0}};         // Dark Orange

        // ::: Mouse Click Operation :::
        this.clickDownOnEntity = function(entityID, mouseEvent){
            if (Entities.getEntityProperties(theDrumObjThis.entityID).name === "BeatMatcher_Drum") {
                theDrumObjThis.hitDrum();
            }
        };

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
        this.getIntervalFromBpm = function(bpm){
            return 60000 / bpm;
        };

        this.getAverageFromList = function(list) {
            var sum = list.reduce(function (acc, val) {
                return acc + val;
            }, 0);
            return Math.floor(sum / list.length);                     // The player probably doesn"t care about precision
        };                                                            // to the millionth of a second, so Math.floor()

        this.getRandomInt = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        // Update high score if high score beaten
        this.checkUpdateHighScore = function(currentScore){
            if (currentScore > theDrumObjThis.highScore){
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

        // High Score
        this.highScore = 0;

        this.SCOREBOARD_RESET_DELAY = 6000;

        // :::: Easy Mode ::::
        // Disable misses and high score for a smooth, easy, beat matching experience.
        // TODO: Add additional entity and logic to make this selectable in-world
        this.isEasyMode = false;
        this.EASY_MODE_MISS_FACTOR = 3;

        if (this.isEasyMode){
            this.MISS_LIMIT = this.MISS_LIMIT * this.EASY_MODE_MISS_FACTOR;
        }

    };

    Drum.prototype = {

        hitDrum: function(){

            // print("XXXX HIT DRUM XXXX");

            // :::: Start beat ::::
            if (!myDrum.hasBeatStarted && myDrum.beatCounter <= 0) {

                // set timestamp for *first* beat
                myDrum.futureBeat = Date.now() + myDrum.getIntervalFromBpm(myDrum.BPM);

                myDrum.hasBeatStarted = true;
                this.shouldCheckTime = true;
                this.startBeat();

            // :::: Check drum hit if already started ::::
            } else if (myDrum.hasBeatStarted && (myDrum.beatCounter > 0 && myDrum.beatsMissed <= myDrum.MISS_LIMIT)){

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

                if (Date.now() >= myDrum.futureBeat) {

                    // set timestamp for *next* beat
                    myDrum.futureBeat = Date.now() + myDrum.getIntervalFromBpm(myDrum.BPM);

                    // Start beat timer
                    myDrum.timeAtStartOfBeat = new Date();

                    // :::: Stop drum after beatsMissed limit - GAME OVER ::::
                    if (myDrum.beatsMissed >= myDrum.MISS_LIMIT) {

                        // Stop beat
                        myDrum.stopBeat();

                        // Default to easy mode for High Score screen
                        myDrum.myScoreboard.screenType = 'easy';

                        myDrum.myScoreboard.textColor = myDrum.myScoreboard.EASY_HIGH_SCORE_TEXT_COLOR;

                        // Compare player's matched beats against high score
                        if (myDrum.checkUpdateHighScore(myDrum.beatsMatched)) {     // Game over, beat high score

                            if (!myDrum.isEasyMode){
                                myDrum.myScoreboard.screenType = 'new';
                                myDrum.myScoreboard.textColor = myDrum.myScoreboard.BEAT_HIGH_SCORE_TEXT_COLOR;
                            }

                        } else {                                                    // Game over, **did not** beat high score

                            if (!myDrum.isEasyMode){
                                myDrum.myScoreboard.screenType = 'current';
                                myDrum.myScoreboard.textColor = myDrum.myScoreboard.SHOW_HIGH_SCORE_TEXT_COLOR;
                            }
                        }

                        // Update scoreboard display with High Score screen
                        myDrum.myScoreboard.updateScoreboard(
                            myDrum.myScoreboard.getScoreboardHighScore(myDrum.myScoreboard.screenType),
                            myDrum.myScoreboard.textColor
                        );

                        // Default to easy mode for Greeting screen
                        myDrum.myScoreboard.textColor = myDrum.myScoreboard.GREETING_TEXT_COLOR;

                        if (!myDrum.isEasyMode){
                            myDrum.myScoreboard.screenType = 'normal';
                        } else {
                            myDrum.myScoreboard.screenType = 'easy';
                        }

                        // Display end game High Score for a few seconds before resetting to Greeting
                        Script.setTimeout(function () {
                            myDrum.myScoreboard.updateScoreboard(
                                myDrum.myScoreboard.getScoreboardGreeting(myDrum.myScoreboard.screenType)
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
                    Entities.editEntity(myDrum.entityID, myDrum.UNCLICKED_COLOR);

                    // Reset to starting color after beat
                    myDrum.colorResetTimeoutID = Script.setTimeout(function () {
                        Entities.editEntity(myDrum.entityID, myDrum.startingColor);
                    }, myDrum.getIntervalFromBpm(myDrum.BPM) / 4);

                    // Check if beat was attempted, as ****UNCLICKED BEATS COUNT AS MISSES****
                    if (!myDrum.beatAttempted) {
                        myDrum.beatsMissed++;

                        // Default to easy mode
                        myDrum.myScoreboard.screenType = 'easymissed';
                        // TODO: Create easy mode unclicked color
                        myDrum.myScoreboard.textColor = myDrum.myScoreboard.UNCLICKED_BEAT_TEXT_COLOR;

                        if (!myDrum.isEasyMode){
                            myDrum.myScoreboard.screenType = 'unclicked';
                        }

                        // Update scoreboard display - unclicked beat
                        myDrum.myScoreboard.updateScoreboard(
                            myDrum.myScoreboard.getScoreboardBeat(myDrum.myScoreboard.screenType),
                            myDrum.myScoreboard.textColor
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

            // Default to easy mode for Greeting screen
            myDrum.myScoreboard.screenType = 'easy';
            // myDrum.myScoreboard.textColor = myDrum.myScoreboard.GREETING_TEXT_COLOR; // TODO: Create easy greeting text color

            if (!myDrum.isEasyMode) {
                myDrum.myScoreboard.screenType = 'normal';
                // myDrum.myScoreboard.textColor = myDrum.myScoreboard.GREETING_TEXT_COLOR;
            }

            // Update scoreboard display
            myDrum.myScoreboard.updateScoreboard(
                myDrum.myScoreboard.getScoreboardBeat(myDrum.myScoreboard.screenType)
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

            myDrum.offset = (myDrum.hitTimeAfterBeat < myDrum.getIntervalFromBpm(myDrum.BPM)/2) ?
                (myDrum.hitTimeAfterBeat * -1) :
                myDrum.getIntervalFromBpm(myDrum.BPM) - myDrum.hitTimeAfterBeat;

            //  show trailing average of last 20 errors or so
            myDrum.averageError = 0.05 * Math.abs(myDrum.offset) + 0.95 * myDrum.averageError;

            // hit within after beat range
            if (myDrum.hitTimeAfterBeat <=
                (myDrum.getIntervalFromBpm(myDrum.BPM) -
                (myDrum.getIntervalFromBpm(myDrum.BPM)/4) )){

                // beat was a match
                this.matchBeat();
            }

            // hit within miss range
            if (myDrum.hitTimeAfterBeat >
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
            Entities.editEntity(myDrum.entityID, myDrum.MATCH_COLOR);

            // Default to easy mode for beat match screen
            myDrum.myScoreboard.screenType = 'easymatched';
            myDrum.myScoreboard.textColor = myDrum.myScoreboard.MATCHED_BEAT_TEXT_COLOR; // TODO: Create easy mode matched color

            if (!myDrum.isEasyMode) {
                myDrum.myScoreboard.screenType = 'matched';
                // myDrum.myScoreboard.textColor = myDrum.myScoreboard.UNCLICKED_TEXT_COLOR;
            }

            // Update scoreboard display - unclicked beat
            myDrum.myScoreboard.updateScoreboard(
                myDrum.myScoreboard.getScoreboardBeat(myDrum.myScoreboard.screenType),
                myDrum.myScoreboard.textColor
            );

        },
        missBeat: function(){

            // print("QQQQQQQQQ MMISSED BEAT QQQQQQQQ");

            myDrum.beatsMissed++;

            // pulse color to myDrum.MISS_COLOR on miss
            Entities.editEntity(myDrum.entityID, myDrum.MISS_COLOR);

            // Default to easy mode for beat miss screen
            myDrum.myScoreboard.screenType = 'easymissed';
            myDrum.myScoreboard.textColor = myDrum.myScoreboard.MISSED_BEAT_TEXT_COLOR; // TODO: Create easy mode missed color

            if (!myDrum.isEasyMode) {
                myDrum.myScoreboard.screenType = 'missed';
                // myDrum.myScoreboard.textColor = myDrum.myScoreboard.MISSED_BEAT_TEXT_COLOR;
            }

            // Update scoreboard display - unclicked beat
            myDrum.myScoreboard.updateScoreboard(
                myDrum.myScoreboard.getScoreboardBeat(myDrum.myScoreboard.screenType),
                myDrum.myScoreboard.textColor
            );

        },
        setMode: function(){

            if (myDrum.isEasyMode){
                myDrum.isEasyMode = false;
            } else if (!myDrum.isEasyMode) {
                myDrum.isEasyMode = true;
            }

        },
        // General use function to check to see if the creator of an entity is also the Drum creator, avoids duplicates?
        isDrumCreator: function(entityCreator){

            var myDrumUserData = JSON.parse(Entities.getEntityProperties(myDrum.entityID, ["userData"]).userData);

            if (entityCreator !== myDrumUserData.creatorUUID) {
                print("NOT THE DRUM OWNER!");
                return false;
            } else {
                print("YOU ARE THE DRUM OWNER! asdojklfnadslkjnfd");
                return true;
            }
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
            myDrum.beatSoundOptions = {
                position: Entities.getEntityProperties(myDrum.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true
            };
            if (!myDrum.beatSound.downloaded){
                print("*****"+myDrum.beatURL+" failed to download!******");
            }

            // GameOver
            myDrum.gameOverURL = "http://theblacksun.s3.amazonaws.com/props/beatMatcher/GameOver.wav";
            myDrum.gameOverSound = SoundCache.getSound(myDrum.gameOverURL);
            myDrum.gameOverSoundOptions = {
                position: Entities.getEntityProperties(myDrum.entityID).position,
                volume: 0.3,
                loop: false,
                stereo: false,
                localOnly: true

            };
            if (!myDrum.gameOverSound.downloaded){
                print("*****"+myDrum.gameOverURL+" failed to download!******");
            }

            // make BeatMatcher Scoreboard parent entity
            myDrum.myScoreboard = new Scoreboard(Vec3.sum(this.entityPosition, {x: 0, y: 0.250, z: -0.05}));

            // Create object of text entities to be our new ScoreboardDisplay to display messages
            myDrum.myScoreboard.scoreboardDisplay = myDrum.myScoreboard.getNewScoreboardDisplay();

        },
        unload: function(){
            // clear beat timer
            Script.clearInterval(myDrum.beatIntervalID);

            // delete ScoreboardLines child entities and object
            myDrum.myScoreboard.deleteScoreboardLines();

            // delete Scoreboard parent entity and object
            myDrum.myScoreboard.deleteScoreboard();

            // De-register hand controller listener
            Script.update.disconnect(myDrum.checkForHandControllerDrumHit);

        }
    };

    var myDrum = new Drum();
    return myDrum;
});