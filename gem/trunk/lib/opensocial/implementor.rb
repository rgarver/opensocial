require 'net/https'
require 'active_support'

module OpenSocial
  module API
    class RecordNotFound < Exception; end
    
    class Implementor
      attr_accessor :token
      attr_accessor :login_method
      attr_accessor :scope
      
      def initialize(scope)
        @scope = URI.parse(scope) unless scope.is_a?(URI)
      end
      
      def client_login(email, password)
        resp = Net::HTTP.post_form(@scope, {:Email => email, :Passwd => password, 
                        :source => OpenSocial::API::Source.to_s, :service => 'ot'})
        @token = resp.body.split("\n").last
        @login_method = "GoogleLogin"
      end
      
      def authsub_proxy(next_addr, opts)
        query_args = {:secure => 0, :session => 1, :scope => @scope}.merge(opts)
        query_args[:next] = next_addr
        
        returning URI.parse('https://www.google.com/accounts/AuthSubRequest') do |uri|
          uri.query = query_args.to_query
        end.to_s
      end
      
      def get(path_ext)
        Net::HTTP.get_response(@scope + path_ext)
      end
      
      def people
        @people ||= OpenSocial::API::People.new(self)
      end
    end
  end
end