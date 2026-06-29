#!/bin/bash
rm -f build.log
echo "Starting deployment" > build.log
npx cross-env NODE_OPTIONS="--max_old_space_size=2048" next build >> build.log 2>&1
echo "Finished build" >> build.log


