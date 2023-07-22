const webcamElement = document.getElementById('webcam');
    const canvasElement = document.getElementById('canvas');
    const webcam = new Webcam(webcamElement, 'user', canvasElement);

    let model = null;
    let cameraFrame = null;
    let running = false
    let timeout = null;

    window.onload = async function() {
        await webgazer.setRegression('ridge') /* currently must set regression and tracker */
        //.setTracker('clmtrackr')
        //.setTracker("TFFacemesh")
        //.setVideoElementCanvas(webcamElement)
        //.showFaceFeedbackBox(0)
        .showFaceOverlay(function(e){
            return dB.params.showFaceOverlay = e,
            bB && (bB.style.display = e ? "block" : "none"),
            dB
        })
        .setGazeListener(function(data, clock) {
            //console.log(data); /* data is an object containing an x and y key which are the x and y prediction coordinates (no bounds limiting) */
            //console.log(clock/60/60); /* elapsed time in milliseconds since webgazer.begin() was called */
            //if (data.eyeFeatures.left.patch.data.length > 0) {
                //if (detectarPiscada(data.eyeFeatures.left.patch.data) ) {
                //console.log('eyes closed');
                //}
            //}
        })
        //.setVideoViewerSize(150,150)
        .saveDataAcrossSessions(true)
        .begin();
        webgazer.showVideoPreview(true) /* shows all video previews */
            .showPredictionPoints(true) /* shows a square every 100 milliseconds where current prediction is */
            .applyKalmanFilter(true); /* Kalman Filter defaults to on. Can be toggled by user. */
    };

    startcapture();
    webcam.start()
    .then(result =>{
        //document.getElementById("video-container").style.display = '';
        console.log("webcam started");
    })
    .catch(err => {
        console.log(err);
    });
    window.onbeforeunload = function() {
        webgazer.end();
    }
    
    async function stopCaptura() {
        if (running) {
            running = false;
            if(cameraFrame!= null){
                cancelAnimationFrame(cameraFrame);
            }
        }
    }

    async function startcapture() {
        // Load the MediaPipe Facemesh package.
        faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
            {maxFaces: 1}
        ).then(mdl => {
            model = mdl;
            //console.log(model);
            cameraFrame = detectKeyPoints();
            timeout = setTimeout(() => {
                //stopCaptura();
            }, 5000);
            running = true;
        }).catch(err => {
            console.log(err);
            stopCaptura();
        });
    }

    async function main() {
        await setupFaceLandmarkDetection();
    }

    async function setupFaceLandmarkDetection() {
        // Setup TF Backend type
        await tf.setBackend('wasm');
    }

    async function detectKeyPoints() {
        // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
        // array of detected faces from the MediaPipe graph. If passing in a video
        // stream, a single prediction per frame will be returned.
        const predictions = await model.estimateFaces({
            input: document.querySelector("video"),
            returnTensors: false,
            flipHorizontal: true,
            predictIrises: true
        });

        //console.log(predictions);

        if (predictions.length > 0) {
            const keypoints = predictions[0].scaledMesh;
            if (detectarPiscada(keypoints)) {
                document.querySelector('#webgazerFaceFeedbackBox').style.border = 'solid red';
                console.log('-----> blinked');
                document.querySelector('#video-text').innerHTML += '-----> blinked';
                //let picture = webcam.snap();
                //return null;
            } else {
                document.querySelector('#webgazerFaceFeedbackBox').style.border = 'solid white';
            }
        }
        cameraFrame = requestAnimationFrame(detectKeyPoints);
    }

    function detectarPiscada(keypoints) {

        leftEye_l = 263
        leftEye_r = 362
        leftEye_t = 386
        leftEye_b = 374

        rightEye_l = 133
        rightEye_r = 33
        rightEye_t = 159
        rightEye_b = 145

        aL = euclidean_dist(keypoints[leftEye_t][0], keypoints[leftEye_t][1], keypoints[leftEye_b][0], keypoints[leftEye_b][1]);
        bL = euclidean_dist(keypoints[leftEye_l][0], keypoints[leftEye_l][1], keypoints[leftEye_r][0], keypoints[leftEye_r][1]);
        earLeft = aL / (2 * bL);

        aR = euclidean_dist(keypoints[rightEye_t][0], keypoints[rightEye_t][1], keypoints[rightEye_b][0], keypoints[rightEye_b][1]);
        bR = euclidean_dist(keypoints[rightEye_l][0], keypoints[rightEye_l][1], keypoints[rightEye_r][0], keypoints[rightEye_r][1]);
        earRight = aR / (2 * bR);

        //console.log('-----> ' + earLeft + '\t' + earRight);

        if ((earLeft < 0.1) || (earRight < 0.1)) {
            return true;
        } else {
            return false;
        }

    }

    function euclidean_dist (x1, y1, x2, y2) {
        return Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );
    };

    main();
