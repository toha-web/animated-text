window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class AnimatedText{
        constructor(context, canvasWidth, canvasHeight){
            this.context = context;
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.textPosX = canvasWidth / 2;
            this.textPosY = canvasHeight / 2;
            this.fontSize = canvasWidth > canvasHeight ? canvasWidth / 15 : canvasHeight / 16;
            this.lineHeight = this.fontSize;
            this.maxTextWidth = (canvasWidth / 3) * 2;
            this.input = document.querySelector("input");
            this.text = this.input.value || this.input.placeholder;
            this.input.addEventListener("input", (e) => {
                this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.text = e.target.value || this.input.placeholder;
                this.init(this.text);
            });
            this.particles = [];
            this.gap = 1;

            this.mouse = {
                radius: this.canvasWidth * 10,
                x: 0,
                y: 0
            }
            window.addEventListener("mousemove", (e) => {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            });

            this.init(this.text);
        }
        init(text){
            const gradient = this.context.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
            gradient.addColorStop(0.4, "red");
            gradient.addColorStop(0.6, "orange");
            gradient.addColorStop(0.8, "yellow");
            this.context.font = `${this.fontSize}px Rubik Doodle Shadow`;
            this.context.fontVariantCaps = "all-small-caps";
            this.context.textAlign = "center";
            this.context.textBaseline = "middle";
            this.context.wordSpacing = "5px";
            this.context.letterSpacing = "5px";

            this.context.strokeStyle = gradient;
            this.context.lineWidth = "1";

            this.context.fillStyle = gradient;

            const textLineWidth = Math.round(this.context.measureText(text).width);
            if (textLineWidth > this.maxTextWidth) {
                this.wrapText(text);
            }
            else{
                this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.context.strokeText(text, this.textPosX, this.textPosY);
                this.context.fillText(text, this.textPosX, this.textPosY);
                this.convertToParticles();
            }
        }
        wrapText(text){
            let words = text.split(" ");
            let lines = [];
            let linesCount = 0;
            let textLine = "";
            for(let i = 0; i < words.length; i++){
                let tempLine = textLine + words[i] + " ";
                if(Math.round(this.context.measureText(tempLine).width) > this.maxTextWidth){
                    textLine = words[i] + " ";
                    linesCount++;
                }
                else{
                    textLine = tempLine;
                }
                lines[linesCount] = textLine;
            }
            let blockHeight = linesCount * this.lineHeight;
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            lines.forEach((line, i) => {
                this.context.fillText(line, this.textPosX, this.textPosY - (blockHeight / 2) + i * this.lineHeight);
                this.context.strokeText(line, this.textPosX, this.textPosY - (blockHeight / 2) + i * this.lineHeight);
            });
            this.convertToParticles();
        }
        convertToParticles(){
            this.particles = [];
            const pixels = this.context.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data;
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            for(let y = 0; y < this.canvasHeight; y += this.gap){
                for(let x = 0; x < this.canvasWidth; x += this.gap){
                    const indexFirstColor = (y * this.canvasWidth + x) * 4;
                    const alfaChanel = pixels[indexFirstColor + 3];
                    if(alfaChanel > 0){
                        const red = pixels[indexFirstColor];
                        const green = pixels[indexFirstColor + 1];
                        const blue = pixels[indexFirstColor +2];
                        const color = `rgba(${red}, ${green}, ${blue})`;
                        this.particles.push(new Particle(this, x, y, color));
                    }
                }
            }
        }
        render(){
            this.particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
        }
    }
    
    class Particle{
        constructor(animatedText, x, y, color){
            this.animatedText = animatedText;
            this.x = Math.random() * this.animatedText.canvasWidth; // start position X
            this.y = Math.random() * this.animatedText.canvasHeight; // start position Y
            this.color = color;
            this.originX = x;
            this.originY = y;
            this.size = this.animatedText.gap;
            this.dx = 0; // horizontal distance between mouse and particle
            this.dy = 0; // vertical distance between mouse and particle
            this.vx = 0; // horizontal speed
            this.vy = 0; // vertical speed
            this.force = 0;
            this.angle = 0;
            this.distance = 0;
            this.friction = Math.random() * 0.6 + 0.15;
            this.ease = Math.random() * 0.1 + 0.005;
        }
        draw(){
            this.animatedText.context.fillStyle = this.color;
            this.animatedText.context.fillRect(this.x, this.y, this.size, this.size);
        }
        update(){
            this.dx = this.animatedText.mouse.x - this.x;
            this.dy = this.animatedText.mouse.y - this.y;
            // this.distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.distance = this.dx * this.dx + this.dy * this.dy;
            this.force = -this.animatedText.mouse.radius / this.distance;

            if(this.distance < this.animatedText.mouse.radius){
                this.angle = Math.atan2(this.dy, this.dx);
                this.vx += this.force * Math.cos(this.angle);
                this.vy += this.force * Math.sin(this.angle);
            }
            this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
            this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease; 
        }
    }

    const animatedText = new AnimatedText(ctx, canvas.width, canvas.height);
    (function animate(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animatedText.render();
        requestAnimationFrame(animate);
    })();

    window.addEventListener("resize", () => {
        location.reload();
    });
})