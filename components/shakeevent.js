import React, { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';

const ShakeEventExpo = {
  addListener: callback => {
    let subscription;

    const startAccelerometer = async () => {
      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        // Set a threshold value for acceleration to detect shaking
        if (acceleration > 5) {
          callback();
        }
      });
    };

    startAccelerometer();

    return () => {
      subscription && subscription.remove();
    };
  },
};

export default ShakeEventExpo;
