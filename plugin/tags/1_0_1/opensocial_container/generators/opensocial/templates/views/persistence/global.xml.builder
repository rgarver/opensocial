xml.instruct!
xml.feed('xmlns' => 'http://www.w3.org/2005/Atom') do
  xml.title("Persistence")
  
  @persistence.each do |data|
    xml.entry do
      xml.id href_from(data)
      xml.title data.key
      xml.content data.value
  
      xml.link 'rel' => 'self', 'type' => 'application/atom+xml', 'href' => href_from(data)
    end
  end
end