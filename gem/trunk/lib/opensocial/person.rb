module OpenSocial
  module API
    class Person < OpenSocial::API::Implemented
      attr_accessor :id, :title, :thumbnail, :updated
      
      def self.new_from_xml(implementor, xml)
        doc = Hpricot(xml)
        self.new_from_document(implementor, doc/'entry')
      end
      
      def self.new_from_document(implementor, doc)
        returning self.new(implementor) do |person|
          person.instance_eval do
            self.id = (doc/'id').text
            @implementor.scope = URI.parse(self.id)
            self.updated = Time.parse((doc/'updated').text)
            self.title = (doc/'title').text
            self.thumbnail = (doc/'link[@rel=thumbnail]').attr('href')
          end
        end
      end
      
      def friends
        id_uri = URI.parse(self.id)
        resp = @implementor.get('/friends')
        if resp.code == '200'
          doc = Hpricot(resp.body)
          returning [] do |friend_array|
            (doc/'entry').each do |entry|
              friend_array << OpenSocial::API::Person.new_from_document(@implementor, entry)
            end
          end
        end
      end
    end
    
    class People < OpenSocial::API::Implemented
      def find(id)
        resp = @implementor.get("people/#{id.to_s}")
        if resp.code == '200'
          Person.new_from_xml(@implementor, resp.body)
        else
          raise OpenSocial::API::RecordNotFound.new
        end
      end
    end
  end
end