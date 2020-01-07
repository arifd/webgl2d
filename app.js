// https://www.youtube.com/watch?v=kB0ZVUrI4Aw&list=PLjcVFFANLS5zH_PeKC6I8p0Pt1hzph_rt

"use strict";

let vertexShaderString =
`#version 300 es
precision mediump float;
in vec2 vertPosition;

void main()
{
  gl_Position = vec4(vertPosition, 0.0, 1.0);
}`;

let fragmentShaderString = "";

async function initWebGL()
{
  // load shader string from file
  await fetch('shader.frag').then(response => response.text()).then(data => fragmentShaderString = data);
 
  let canvas = document.getElementById('maincanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let gl = canvas.getContext('webgl2');

  // set a unique background colour if all else fails!
  gl.clearColor(0.75, 0.85, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  function createShader(type, source, name = "")
  {
    // type: either "vertex", "fragment"
    if (!name) name = type;
    // create shader
    let shader;
    if (type === "vertex") shader = gl.createShader(gl.VERTEX_SHADER);
    else if (type === "fragment") shader = gl.createShader(gl.FRAGMENT_SHADER);
    else console.log("createShader() error: error in type");
    // set source
    gl.shaderSource(shader, source);
    // compile
    gl.compileShader(shader);
    
    let compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (compileStatus) return shader;
    
    // if we didn't already return, there was an error.
    console.error(`ERROR compiling ${name} shader:`, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  function createProgram(vertexShader, fragmentShader, name = "")
  {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    let status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (status) return program;

    console.error(`error linking ${name + " "}program`, gl.getProgramInfoLog(program));

    // if we are successful until here, is a further validation step really necessary?
    // gl.validateProgram(program);
    // if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS))
    //  console.error('error validating program', gl.getProgramInfoLog(program));
  }

  let vertexShader = createShader("vertex", vertexShaderString);
  let fragmentShader = createShader("fragment", fragmentShaderString);
  // above 2 variables won't be referenced anymore in the code, but the program below will.
  let program = createProgram(vertexShader, fragmentShader);

  // ---------------------------------------
  
  // Now  that we've created our program, we need to supply data to it

  //
  // setup and send buffer
  //

  // Create a vertex buffer
  let quadVertices = // X,Y positions
  [
    -1.0, -1.0,
    1.0, -1.0,
    1.0, 1.0,
    -1.0, 1.0,
  ];

  let quadIndices = [0, 1, 2, 2, 3, 0];

  // send the vertex & indices buffers to the GPU
  let vertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject); 
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

  let indexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW);

  // tell the GPU how the buffer's structured and where to point its attribute variables
  let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
  gl.vertexAttribPointer(
    positionAttribLocation, // Attribute location
    2, // number of elements per attribute
    gl.FLOAT, // type of elements
    gl.FALSE, // is data normalised?
    2 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
    0 // offset from the begining of a single vertex
  );
  gl.enableVertexAttribArray(positionAttribLocation);

  //-------------------------------------------

  //
  // communicate uniform variables to the GPU
  //

  // Uniforms are bound to program, so we have to tell OpenGL state machine which program is active
  gl.useProgram(program);

  // get pointers
  let iTimeUniformLocation = gl.getUniformLocation(program, 'iTime');
  let iResolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');

  // // use the appropriate function to send datatype data
  // // more info: https://stackoverflow.com/questions/31049910/setting-uniforms-in-webgl
  gl.uniform1f(iTimeUniformLocation, 0.0);
  gl.uniform3fv(iResolutionUniformLocation, [canvas.width, canvas.height, 1]);


  //
  // Main render loop
  //
  let fakeTime = 0;
  function draw()
  {
    gl.uniform1f(iTimeUniformLocation, fakeTime);

    gl.drawElements(gl.TRIANGLES, quadIndices.length, gl.UNSIGNED_SHORT, 0); // draw type, number of vertices, type of data, offset
    fakeTime += 0.01;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  

};

