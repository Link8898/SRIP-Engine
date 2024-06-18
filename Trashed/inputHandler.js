// User Input Event Listeners
window.addEventListener("resize", function (event) { // Window resizing
    //logic.AlterSimulationArea(document.body.clientWidth, document.body.clientHeight);
});
window.onmousemove = function (event) { // Mouse movement
    logic.UpdateMouse(event.clientX, event.clientY);
};
document.getElementById("sceneCanvas").onmouseup = (event) => { // Left click down on scene view
    //logic.Grab(false);
};
document.getElementById("sceneCanvas").onmouseup = (event) => { // Left click release on scene view
    logic.UpdateMouse(event.clientX, event.clientY);
    logic.HandleClick();
    if (logic.selectedEntity != -1) {
        for (let element of document.getElementById("inspector").getElementsByClassName("component")) {
            element.style.opacity = "100%";
            element.style.width = "100%";
            element.style.flexGrow = "1";
        }
        document.getElementById("nameInput").value = logic.entities[logic.selectedEntity].name;
        document.getElementById("tagInput").value = logic.entities[logic.selectedEntity].tag;
        document.getElementById("xInput").value = Math.floor(logic.entities[logic.selectedEntity].position.x);
        document.getElementById("xSlider").value = Math.floor(logic.entities[logic.selectedEntity].position.x);
        document.getElementById("yInput").value = Math.floor(logic.entities[logic.selectedEntity].position.y);
        document.getElementById("ySlider").value = Math.floor(logic.entities[logic.selectedEntity].position.y);
        document.getElementById("widthInput").value = Math.floor(logic.entities[logic.selectedEntity].width);
        document.getElementById("widthSlider").value = Math.floor(logic.entities[logic.selectedEntity].width);
        document.getElementById("heightInput").value = Math.floor(logic.entities[logic.selectedEntity].height);
        document.getElementById("heightSlider").value = Math.floor(logic.entities[logic.selectedEntity].height);
        document.getElementById("massInput").value = Math.floor(logic.entities[logic.selectedEntity].mass);
        document.getElementById("massSlider").value = Math.floor(logic.entities[logic.selectedEntity].mass);
        document.getElementById("kinematicInput").checked = logic.entities[logic.selectedEntity].kinematic;
        document.getElementById("gravityInput").checked = logic.entities[logic.selectedEntity].gravity;
    }
    else {
        for (let element of document.getElementById("inspector").getElementsByClassName("component")) {
            element.style.opacity = "0%";
            element.style.width = "0%";
            element.style.flexGrow = "0";
        }
    }
    RenderScene();
};
document.getElementById("sceneCanvas").addEventListener("contextmenu", (event) => { // Right click
    event.preventDefault();
    logic.CreateEntity("SQUARE", new Vector(logic.mouseX, logic.mouseY), 50, 50, new SquareCollider(50, 50));
    RenderScene();
});
window.addEventListener("wheel", event => { // Scroll wheel
    const delta = Math.sign(event.deltaY);
    ScaleViewport(delta);
});

// Viewport traversal inputs
let lArrow = false; let rArrow = false; let uArrow = false; let dArrow = false; let shifting = false;
window.addEventListener("keydown", function (event) { // Key down
    if (event.code == "Tab") { // Terminal window
        event.preventDefault();
        if (document.getElementById("terminal").style.display == "flex") {
            document.getElementById("terminal").style.display = "none";
            document.getElementById("scriptText").value = "";
        }
        else {
            document.getElementById("terminal").style.display = "flex";
            if (logic.selectedEntity != -1) {
                document.getElementById("scriptText").value = logic.entities[logic.selectedEntity].behavior;
            }
        }
    }
    if (document.getElementById("terminal").style.display == "flex") { return; } // Ignore input when scripting

    // Pass to logic and all objects that access keyboard input
    logic.KeyInput(event.key);

    if (event.code == "KeyP") {
        Playmode();
        RenderScene();
    }
    if (event.code == "Digit1") {
        logic.CreateEntity("SQUARE", new Vector(0, 0), 50, 50, new SquareCollider(50, 50));
        RenderScene();
    }
    if (event.code == "Digit2") {
        logic.CreateEntity("CIRCLE", new Vector(0, 0), 50, 50, new CircleCollider(25));
        RenderScene();
    }
    if (event.code == "KeyT") {
        console.log("Entities:");
        console.log(logic.entities);
    }
    if (event.code == "ArrowLeft" && !lArrow) { lArrow = true; ShiftViewport(); }
    if (event.code == "ArrowRight" && !rArrow) { rArrow = true; ShiftViewport(); }
    if (event.code == "ArrowUp" && !uArrow) { uArrow = true; ShiftViewport(); }
    if (event.code == "ArrowDown" && !dArrow) { dArrow = true; ShiftViewport(); }
});

window.addEventListener("keyup", function (event) { // Key up
    if (event.code == "ArrowLeft") { lArrow = false; }
    if (event.code == "ArrowRight") { rArrow = false; }
    if (event.code == "ArrowUp") { uArrow = false; }
    if (event.code == "ArrowDown") { dArrow = false; }
});

// Moving the viewport
function ShiftViewport() {
    if (!shifting) {
        shifting = true;
        if (lArrow) { logic.viewport.position.x -= 5; }
        if (rArrow) { logic.viewport.position.x += 5; }
        if (uArrow) { logic.viewport.position.y -= 5; }
        if (dArrow) { logic.viewport.position.y += 5; }
        RenderScene();
        if (lArrow || rArrow || uArrow || dArrow) { setTimeout(function () { shifting = false; ShiftViewport(); }, 0); }
        else { shifting = false; }
    }
}

// Scaling the viewport
function ScaleViewport(scroll) {
    // CHANGE LOGIC SCALING ISSUES AND CONSTANTS FOR RESOLUTION
    if (scroll < 0 && sceneCanvas.width < 3840) {
        sceneCanvas.width *= 1.2;
        sceneCanvas.height *= 1.2;
        RenderScene();
    }
    else if (scroll > 0 && sceneCanvas.width > 960) {
        sceneCanvas.width /= 1.2;
        sceneCanvas.height /= 1.2;
        RenderScene();
    }
}

// Updating behavior
document.getElementById("scriptText").oninput = function () {
    if (logic.selectedEntity != -1) {
        logic.entities[logic.selectedEntity].behavior = document.getElementById("scriptText").value;
    }
}

// Transform values
document.getElementById("xInput").oninput = function () { document.getElementById("xSlider").value = document.getElementById("xInput").value; UpdateComponents(); };
document.getElementById("yInput").oninput = function () { document.getElementById("ySlider").value = document.getElementById("yInput").value; UpdateComponents(); };
document.getElementById("widthInput").oninput = function () { document.getElementById("widthSlider").value = document.getElementById("widthInput").value; UpdateComponents(); };
document.getElementById("heightInput").oninput = function () { document.getElementById("heightSlider").value = document.getElementById("heightInput").value; UpdateComponents(); };
document.getElementById("massInput").oninput = function () { document.getElementById("massSlider").value = document.getElementById("massInput").value; UpdateComponents(); };
document.getElementById("xSlider").oninput = function () { document.getElementById("xInput").value = document.getElementById("xSlider").value; UpdateComponents(); };
document.getElementById("ySlider").oninput = function () { document.getElementById("yInput").value = document.getElementById("ySlider").value; UpdateComponents(); };
document.getElementById("widthSlider").oninput = function () { document.getElementById("widthInput").value = document.getElementById("widthSlider").value; UpdateComponents(); };
document.getElementById("heightSlider").oninput = function () { document.getElementById("heightInput").value = document.getElementById("heightSlider").value; UpdateComponents(); };
document.getElementById("massSlider").oninput = function () { document.getElementById("massInput").value = document.getElementById("massSlider").value; UpdateComponents(); };
document.getElementById("kinematicInput").oninput = function () { UpdateComponents(); };
document.getElementById("gravityInput").oninput = function () { UpdateComponents(); };
function UpdateComponents() { // Updates the entities attributes to the component values
    logic.entities[logic.selectedEntity].position = new Vector(parseInt(document.getElementById("xInput").value), parseInt(document.getElementById("yInput").value));
    logic.entities[logic.selectedEntity].width = parseInt(document.getElementById("widthInput").value);
    logic.entities[logic.selectedEntity].height = parseInt(document.getElementById("heightInput").value);
    logic.entities[logic.selectedEntity].mass = parseInt(document.getElementById("massInput").value);
    logic.entities[logic.selectedEntity].kinematic = document.getElementById("kinematicInput").checked;
    logic.entities[logic.selectedEntity].gravity = document.getElementById("gravityInput").checked;
    RenderScene();
}