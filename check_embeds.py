import urllib.request

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Dest': 'iframe',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site'
}

urls = [
    'https://multiembed.mov/?video_id=27205&tmdb=1',
    'https://multiembed.mov/?video_id=114410&tmdb=1&s=1&e=1',
    'https://vidsrc.me/embed/movie?tmdb=27205',
    'https://vidsrc.to/embed/movie/27205',
    'https://vidsrc.cc/v2/embed/movie/27205',
    'https://vidsrc.in/embed/movie/27205',
    'https://vidsrc.buzz/embed/movie/27205',
    'https://vidsrc.pm/embed/movie?tmdb=27205'
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as r:
            print(f"{u} -> {r.getcode()} (len {len(r.read())})")
    except Exception as e:
        print(f"{u} -> FAIL: {e}")
