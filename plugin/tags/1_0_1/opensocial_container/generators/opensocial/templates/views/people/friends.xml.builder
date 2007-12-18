xml.instruct!
xml.feed('xmlns' => 'http://www.w3.org/2005/Atom', 
        'xmlns:openSearch' => 'http://a9.com/-/spec/opensearchrss/1.0/',
        'xmlns:georss' => 'http://www.georss.org/georss', 
        'xmlns:gd' => 'http://schemas.google.com/g/2005') do
  xml.title("Friends")
  xml.author do
    xml.name(@person.title)
  end
  
  @friends.each do |friend|
    xml.entry do
      xml.id href_from(friend)
      xml.updated friend.updated_at.xmlschema
      xml.title friend.title
  
      xml.link 'rel' => 'self', 'type' => 'application/atom+xml', 'href' => href_from(friend)
    end
  end
end