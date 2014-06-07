//
//  myBalance.js
//  examples
//
//  Created by Stojce Slavkovski on June 5, 2014
//  Copyright 2014 High Fidelity, Inc.
//
//  Show wallet balance
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var Controller = Controller || {};
var Overlays = Overlays || {};
var Script = Script || {};
var Account = Account || {};

(function () {
    "use strict";
    var iconUrl = 'http://localhost/~stojce/',
        overlayWidth = 150,
        overlayHeight = 50,
        overlayTopOffset = 15,
        overlayRightOffset = 100,
        textRightOffset = 75,
        maxDecimals = 5,
        downColor = {
            red: 0,
            green: 0,
            blue: 255
        },
        upColor = {
            red: 0,
            green: 255,
            blue: 0
        },
        normalColor = {
            red: 204,
            green: 204,
            blue: 204
        },
        balance = -1,
        voxelTool = Overlays.addOverlay("image", {
            x: 0,
            y: overlayTopOffset,
            width: 92,
            height: 32,
            imageURL: iconUrl + "wallet.svg",
            alpha: 1
        }),
        textOverlay = Overlays.addOverlay("text", {
            x: 0,
            y: overlayTopOffset,
            topMargin: 9,
            font: {
                size: 15
            },
            color: normalColor,
            alpha: 0
        });

    function scriptEnding() {
        Overlays.deleteOverlay(voxelTool);
        Overlays.deleteOverlay(textOverlay);
    }

    function update(deltaTime) {
        var xPos = Controller.getViewportDimensions().x;
        Overlays.editOverlay(voxelTool, {
            x: xPos - overlayRightOffset,
            visible: Account.isLoggedIn()
        });

        Overlays.editOverlay(textOverlay, {
            x: xPos - textRightOffset,
            visible: Account.isLoggedIn()
        });
    }

    function updateBalance(newBalance) {
        if (balance === newBalance) {
            return;
        }

        var change = newBalance - balance,
            textColor = change < 0 ? downColor : upColor,
            integers = newBalance.toFixed(0).length,
            decimals = integers > maxDecimals ? 0 : maxDecimals - integers;

        balance = newBalance;
        Overlays.editOverlay(textOverlay, {
            text: balance.toFixed(decimals),
            color: textColor
        });

        Script.setTimeout(function () {
            Overlays.editOverlay(textOverlay, {
                color: normalColor
            });
        }, 1000);
    }

    updateBalance(Account.getBalance());
    Account.balanceChanged.connect(updateBalance);
    Script.scriptEnding.connect(scriptEnding);
    Script.update.connect(update);
}());