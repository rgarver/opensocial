xml.instruct!
xml.feed('xmlns' => "http://www.w3.org/2005/Atom") do
  xml.link(:rel => 'self', :type => "application/atom+xml", 
          :href => "http://#{request.host}:#{request.port}/feeds/app/#{params[:app_id]}/persistence/#{params[:persistence_id]}/shared")
  
  @persistences.each do |persistence|
    xml.entry do
      xml.link(:rel => 'self', :type => "application/atom+xml", 
              :href => "http://#{request.host}:#{request.port}/feeds/app/#{params[:app_id]}/persistence/#{params[:persistence_id]}/shared/#{persistence.key}")
      xml.title(persistence.key)
      xml.content(persistence.value)
    end
  end
end