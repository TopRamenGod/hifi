//
//  createBeatMatcher.js
//
//  Created by Michael 'TopRamenGod' Varner on 2/8/2017
//  Copyright 2017 High Fidelity, Inc.
//
//  This entity script handles the logic for a rhythm practice toy.
//
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var SCRIPT_URL = "http://theblacksun.s3.amazonaws.com/props/beatMatcher/beatMatcher.js";

var beatMatcherProperties = {
    position: Vec3.sum(Vec3.sum(MyAvatar.position, {
        x: 0,
        y: 0.6,
        z: 0
    }), Vec3.multiply(1, Quat.getFront(Camera.getOrientation()))),
    name: 'BeatMatcher_Drum',
    type: 'Sphere',
    script: SCRIPT_URL,
    dimensions: {
        x: 0.12,
        y: 0.12,
        z: 0.12
    },
    lifetime: 3600,
    userData: JSON.stringify({
        grabbableKey: {wantsTrigger: true}
    })
}

var _beatMatcher = Entities.addEntity(beatMatcherProperties);

Script.stop();