import requests

api_endpoint = 'https://commons.wikimedia.org/w/api.php'

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}

categories = [
  'Academic disciplines',
  'Behavior',
  'Business',
  'Communication',
  'Concepts',
  'Culture',
  'Economy',
  'Education',
  'Energy',
  'Engineering',
  'Entities',
  'Food and Drink',
  'Geography',
  'Government',
  'Humanities',
  'Information',
  'Knowledge',
  'Language',
  'Law',
  'Life',
  'Lists',
  'Mass media',
  'Mathematics',
  'Nature',
  'People',
  'Philosophy',
  'Politics',
  'Religion',
  'Science',
  'Society',
  'Technology',
  'Time',
  'Universe'
]

for cat in categories:
  print(f"Processing: {cat}")
  
  # First try: Use pageimages prop to get the actual category thumbnail
  response = requests.get(api_endpoint, {
    'action': 'query',
    'titles': f'Category:{cat.replace(" ","_")}',
    'prop': 'pageimages',
    'pithumbsize': 800,  # Increased from 300 to 800 for better quality
    'format': 'json',
    'formatversion': 2
  }, headers=headers).json()
  
  try:
    page = response['query']['pages'][0]
    
    if 'thumbnail' in page:
      thumbnail_url = page['thumbnail']['source']
      print(f"  Found thumbnail: {thumbnail_url}")
      
      image = requests.get(thumbnail_url, headers=headers).content

      # Get file extension from URL
      extension = thumbnail_url.split('.')[-1].split('?')[0]
      if extension not in ['jpg', 'jpeg', 'png', 'svg']:
        extension = 'jpg'

      with open(f'./assets/images/categories/{cat}.{extension}', mode="wb") as file:
        file.write(image)
      print(f"  Saved: {cat}.{extension}")
      
    else:
      # Fallback: Search for images related to the category name
      print(f"  No thumbnail found, searching for related images...")
      
      search_response = requests.get(api_endpoint, {
        'action': 'query',
        'list': 'search',
        'srsearch': cat,
        'srnamespace': 6,  # File namespace
        'srlimit': 1,
        'format': 'json',
        'formatversion': 2
      }, headers=headers).json()
      
      if 'query' in search_response and 'search' in search_response['query'] and len(search_response['query']['search']) > 0:
        image_title = search_response['query']['search'][0]['title']
        print(f"  Found image: {image_title}")
        
        # Get the image URL with thumbnail parameters
        imageinfo = requests.get(api_endpoint, {
          'action': 'query',
          'titles': image_title,
          'prop': 'imageinfo',
          'iiprop': 'url',
          'iiurlwidth': 800,  # Increased from 300 to 800 for better quality
          'format': 'json',
          'formatversion': 2
        }, headers=headers).json()
        
        if 'query' in imageinfo and 'pages' in imageinfo['query']:
          image_page = imageinfo['query']['pages'][0]
          if 'imageinfo' in image_page and len(image_page['imageinfo']) > 0:
            thumbnail_url = image_page['imageinfo'][0]['thumburl'] if 'thumburl' in image_page['imageinfo'][0] else image_page['imageinfo'][0]['url']
            
            image = requests.get(thumbnail_url, headers=headers).content
            
            # Get file extension
            extension = thumbnail_url.split('.')[-1].split('?')[0]
            if extension not in ['jpg', 'jpeg', 'png', 'svg']:
              extension = 'jpg'
            
            filename = f'./assets/images/categories/{cat}.{extension}'
            with open(filename, mode="wb") as file:
              file.write(image)
            print(f"  Saved fallback: {filename}")
          else:
            print(f"  No image info found")
        else:
          print(f"  No image info response")
      else:
        print(f"  No images found in search")
        
  except Exception as e:
    print(f"  Error: {e}")