/*
*  createBeatMatcher.js
*
*  Created by Michael 'TopRamenGod' Varner on 02-FEB-2017
*  Copyright 2017 High Fidelity, Inc.
*
*  This script creates a rhythm practice toy.
*
*
*  Distributed under the Apache License, Version 2.0.
*  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
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
}

var _beatMatcher = Entities.addEntity(beatMatcherProperties);

Script.stop();