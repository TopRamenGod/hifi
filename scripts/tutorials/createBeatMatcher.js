/*
*  createBeatMatcher.js
*
*  Created by Michael 'TopRamenGod' Varner on 02-FEB-2017
*  Copyright 2017 High Fidelity, Inc.
*
*  This script creates a rhythm practice toy.
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
 * The Scoreboard is an addressable and formattable marquee (including textColor) created from an array of text entities,
 * created from ScoreboardLine objects. Since the text entity currently has no formatting capabilities, this script provides
 * methods for justifying the contents of each line of the scoreboard.
 *
 * Use the Scoreboard.prototype.padLine( str, justification ) method to justify the contents of each line.
 *
 *
 * -- Misc --
 * Developer's Note: the current text entity font is not fixed width, so it's kind of difficult to format lines with
 * precision, but this gets closer than nothing. :)
 *
 * To cleanly delete the BeatMatcher 5000, simply delete the Drum entity. *
 *
 *
 * Distributed under the Apache License, Version 2.0.
 * See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
 */

var SCRIPT_URL = "https://raw.githubusercontent.com/TopRamenGod/hifi/21142/scripts/tutorials/entity_scripts/beatMatcher.js";

// The drum entity, parent object of BeatMatcher
var beatMatcherProperties = {
    position: Vec3.sum(Vec3.sum(MyAvatar.position, {
        x: 0,
        y: 0.6,
        z: 0
    }), Vec3.multiply(1, Quat.getFront(Camera.getOrientation()))),
    name: "BeatMatcher_Drum",
    type: "Sphere",
    script: SCRIPT_URL,
    dimensions: {
        x: 0.15,
        y: 0.15,
        z: 0.15
    },
    lifetime: 3600,
    userData: JSON.stringify({
        grabbableKey: {wantsTrigger: true}
    })
};

// A BeatMatcher entity, use this to pass entityID
var _beatMatcherEntity = Entities.addEntity(beatMatcherProperties);


// Credit to Coal for inspiration on this one...
var setOwner = function(entityID) {
    var userData = JSON.parse(Entities.getEntityProperties(entityID, ["userData"]).userData);
    userData.creatorUUID = MyAvatar.sessionUUID;
    Entities.editEntity(entityID, {
        userData: JSON.stringify(userData)
    });
};

// set 'owner' of the BeatMatcher, to avoid unnecessary duplication of child entities from other clients in the domain
setOwner(_beatMatcherEntity);

Script.stop();