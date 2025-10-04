from flask import Flask, render_template, request as req, send_file
from flask_talisman import Talisman
from yt_dlp import YoutubeDL
from re import match
from os import path
from pathlib import Path

app = Flask(__name__)

# Configure Talisman with CSP rules for YouTube
csp = {
    'default-src': "'self'",
    'img-src': "'self' data: https://*.youtube.com https://*.ytimg.com",
    'frame-src': "'self' https://*.youtube.com https://youtube.com",
    'script-src': "'self' 'unsafe-inline' https://*.youtube.com",
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src': "'self' https://fonts.gstatic.com",
}

Talisman(
    app,
    content_security_policy=csp,
    content_security_policy_nonce_in=['script-src'],
    force_https=True
)

def validate_youtube_url(url):
    if not url:
        return False
        
    # Regular expressions for different YouTube URL formats
    youtube_patterns = [
        r'^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=([a-zA-Z0-9_-]{11}))(?:\S+)?$',
        r'^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\S*)?$',
        r'^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\S*)?$'
    ]
    
    return any(match(pattern, url) for pattern in youtube_patterns)

def download_video(url):
    download_path = Path("downloads").absolute()
    download_path.mkdir(exist_ok=True)
    
    ydl_opts = {
        'format': 'best',  # Download best quality
        'outtmpl': str(download_path / '%(title)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_path = str(download_path / f"{info['title']}.{info['ext']}")
            return video_path, None
    except Exception as e:
        return None, str(e)

@app.route("/")
def homepage():
    return render_template("index.html", title="YouTube Downloader")

@app.route("/download")
def getUrl():
    url = req.args.get("vidurl", "")
    if not validate_youtube_url(url):
        return {"error": "Invalid YouTube URL"}, 400
        
    video_path, error = download_video(url)
    if error:
        return {"error": error}, 500
        
    try:
        return send_file(
            video_path,
            as_attachment = True,
            download_name = path.basename(video_path)
        )
    except Exception as e:
        return {"error": "Failed to send file"}, 500

if __name__ == "__main__":
    app.run(port=9000)


