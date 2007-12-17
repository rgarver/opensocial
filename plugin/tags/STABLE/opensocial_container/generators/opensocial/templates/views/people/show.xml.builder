xml.instruct!
xml.entry('xmlns' => 'http://www.w3.org/2005/Atom', 
          'xmlns:georss' => 'http://www.georss.org/georss', 
          'xmlns:gd' => 'http://schemas.google.com/g/2005') do
  xml.id @person.send(@person.class.opensocial_id_column_name)
  xml.updated @person.updated_at.xmlschema
  xml.title @person.title
  
  xml.link 'rel' => 'self', 'type' => 'application/atom+xml', 'href' => href_from(@person)
end