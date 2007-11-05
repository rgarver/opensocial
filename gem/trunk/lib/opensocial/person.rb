module OpenSocial
  module API
    class Person
      attr_accessor :id, :title, :thumbnail, :updated
      
      def self.new_from_xml(xml)
        doc = Hpricot(xml)
        
        returning self.new do |person|
          person.instance_eval do
            self.id = (doc/'entry id').text
            self.updated = Time.parse((doc/'entry updated').text)
            self.title = (doc/'entry title').text
            self.thumbnail = (doc/'entry link[@rel=thumbnail]').attr('href')
          end
        end
      end
    end
    
    class People
      def initialize(implementor)
        @implementor = implementor
      end
      
      def find(id)
        resp = @implementor.get("people/#{id.to_s}")
        if resp.code == '200'
          Person.new_from_xml(resp.body)
        else
          raise OpenSocial::API::RecordNotFound.new
        end
      end
    end
  end
end