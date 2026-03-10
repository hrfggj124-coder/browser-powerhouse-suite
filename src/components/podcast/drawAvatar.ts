import { Actor, AVATAR_SIZE } from "./types";

export function drawAvatar(
  canvas: HTMLCanvasElement,
  actor: Actor,
  mouthOpenAmount: number,
  isActive: boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  if (actor.imageUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = actor.imageUrl;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 70, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - 70, cy - 80, 140, 140);
    ctx.restore();

    // Draw mouth overlay that blends with the photo
    // Position at lower third of face circle for natural lip placement
    const photoMouthY = cy + 25;
    if (mouthOpenAmount > 1) {
      ctx.save();
      // Clip mouth area to face circle so it doesn't overflow
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 70, 0, Math.PI * 2);
      ctx.clip();

      const mouthW = 18 + mouthOpenAmount * 0.4;
      const mouthH = 2 + mouthOpenAmount * 0.8;

      // Shadow behind mouth for depth
      ctx.beginPath();
      ctx.ellipse(cx, photoMouthY, mouthW + 2, Math.max(3, mouthH + 1), 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();

      // Lip shape
      ctx.beginPath();
      ctx.ellipse(cx, photoMouthY, mouthW, Math.max(2, mouthH), 0, 0, Math.PI * 2);
      ctx.fillStyle = mouthOpenAmount > 5 ? "#8b2020" : "#a63030";
      ctx.fill();

      // Inner mouth darkness
      if (mouthOpenAmount > 6) {
        ctx.beginPath();
        ctx.ellipse(cx, photoMouthY, mouthW * 0.6, mouthH * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#3d0d0d";
        ctx.fill();
      }

      // Upper lip line
      ctx.beginPath();
      ctx.moveTo(cx - mouthW, photoMouthY);
      ctx.quadraticCurveTo(cx, photoMouthY - mouthH * 0.3, cx + mouthW, photoMouthY);
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  } else {
    const skinColor = actor.sex === "male" ? "#f0c8a0" : "#f5d5c0";
    const hairColor =
      actor.age === "senior" ? "#ccc" : actor.sex === "male" ? "#4a3728" : "#2c1810";

    ctx.beginPath();
    ctx.arc(cx, cy - 15, 60, 0, Math.PI * 2);
    ctx.fillStyle = skinColor;
    ctx.fill();

    ctx.beginPath();
    if (actor.sex === "male") {
      ctx.arc(cx, cy - 35, 58, Math.PI, Math.PI * 2);
      ctx.fillStyle = hairColor;
      ctx.fill();
    } else {
      ctx.arc(cx, cy - 25, 62, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fillStyle = hairColor;
      ctx.fill();
      ctx.fillRect(cx - 62, cy - 25, 14, 70);
      ctx.fillRect(cx + 48, cy - 25, 14, 70);
    }

    const eyeY = cy - 20;
    ctx.beginPath();
    ctx.arc(cx - 18, eyeY, 6, 0, Math.PI * 2);
    ctx.arc(cx + 18, eyeY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#333";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - 18, eyeY - 1, 2, 0, Math.PI * 2);
    ctx.arc(cx + 18, eyeY - 1, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  // Mouth (only for non-image actors; image actors have mouth drawn in the image section)
  if (!actor.imageUrl) {
    const mouthY = cy + 15;
    ctx.beginPath();
    const mouthWidth = 20 + mouthOpenAmount * 0.5;
    const mouthHeight = 2 + mouthOpenAmount;
    ctx.ellipse(cx, mouthY, mouthWidth, Math.max(2, mouthHeight), 0, 0, Math.PI * 2);
    ctx.fillStyle = mouthOpenAmount > 5 ? "#c0392b" : "#e74c3c";
    ctx.fill();

    if (mouthOpenAmount > 8) {
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, mouthWidth * 0.6, mouthHeight * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#7f1d1d";
      ctx.fill();
    }
  }

  // Body
  const bodyY = actor.imageUrl ? cy + 75 : cy + 55;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY + 30, 55, 35, 0, Math.PI, Math.PI * 2, true);
  ctx.fillStyle = actor.color;
  ctx.fill();

  // Active glow
  if (isActive && mouthOpenAmount > 3) {
    ctx.beginPath();
    ctx.arc(cx, cy - 15, 75 + mouthOpenAmount * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = actor.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Speech bubble
  if (isActive && actor.speechBubble && mouthOpenAmount > 2) {
    const bubbleX = cx;
    const bubbleY = cy - 90;
    const text = actor.speechBubble;
    ctx.font = "12px Inter, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const padding = 12;
    const bw = textWidth + padding * 2;
    const bh = 28;

    // Bubble
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.roundRect(bubbleX - bw / 2, bubbleY - bh / 2, bw, bh, 8);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(bubbleX - 6, bubbleY + bh / 2);
    ctx.lineTo(bubbleX, bubbleY + bh / 2 + 10);
    ctx.lineTo(bubbleX + 6, bubbleY + bh / 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();

    // Text
    ctx.fillStyle = "#1a1a2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bubbleX, bubbleY);
  }

  // Name label
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(actor.name, cx, h - 10);
}
