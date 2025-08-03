terraform {
  backend "s3" {
    bucket = "my-terraform-state-bucket"
    key    = "expense-tracker/terraform.tfstate"
    region = "eu-north-1"
  }
}

provider "aws" {
    region = "eu-north-1"
}

#New VPC 
resource "aws_vpc" "Expense-Tracker-vpc" {
    cidr_block = "10.0.0.0/16"
    instance_tenancy = "default"
    tags = {
        Name = "ExpenseTrackerVPC"
    }
}
#New Subnet
resource "aws_subnet" "server_subnet" {
    vpc_id = aws_vpc.Expense-Tracker-vpc.id 
    cidr_block = "10.0.1.0/24"
    availability_zone = "eu-north-1a"
    tags = {
        Name = "ServerSubnet"
    }
}

resource "aws_route_table" "RT_table" {
    vpc_id = aws_vpc.Expense-Tracker-vpc.id 
    tags = {
        Name = "App_Route_Table"
    }
}

resource "aws_route_table_association" "RT-Association" {
    subnet_id = aws_subnet.server_subnet.id
    route_table_id = aws_route_table.RT_table.id 
}

resource "aws_route" "internet_route" {
    destination_cidr_block = "0.0.0.0/0"
    route_table_id = aws_route_table.RT_table.id 
    gateway_id = aws_internet_gateway.Server_IGW.id 
}

#New IGW 
resource "aws_internet_gateway" "Server_IGW" {
    vpc_id = aws_vpc.Expense-Tracker-vpc.id
    tags = {
        Name = "ServerIGW"
    }
}
#New EC2 
resource "aws_instance" "Server" {
    subnet_id = aws_subnet.server_subnet.id
    associate_public_ip_address = true
    ami           = "ami-042b4708b1d05f512"
    instance_type = "t3.micro"
    security_groups = [aws_security_group.allow_tls.id]
    key_name = "sample_keys"

   
    tags = {
        Name = "Expense Tracker Server"
    }

}
#Security Groups 
resource "aws_security_group" "allow_tls" {
  name        = "allow_tls"
  description = "Allow TLS inbound traffic and all outbound traffic"
  vpc_id      = aws_vpc.Expense-Tracker-vpc.id

  tags = {
    Name = "allow_list"
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_https" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}
resource "aws_vpc_security_group_ingress_rule" "custom_tcp" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 3000
  ip_protocol       = "tcp"
  to_port           = 3000
}

resource "aws_vpc_security_group_ingress_rule" "allow_http" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}
resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  security_group_id = aws_security_group.allow_tls.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}

output "public_ip" {
    value = aws_instance.Server.public_ip
}