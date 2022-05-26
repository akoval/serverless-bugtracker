# AWS Client VPN setup guide for BugTracker Serverless project

All commands must be execute in current directory.

## Install cfssl and cfssljson tools

* download required binaries

```
mkdir {bin,certs}
wget -q https://github.com/cloudflare/cfssl/releases/download/v1.6.1/cfssljson_1.6.1_linux_amd64 -O bin/cfssljson
wget -q https://github.com/cloudflare/cfssl/releases/download/v1.6.1/cfssl_1.6.1_linux_amd64 -O bin/cfssl
chmod +x bin/cfssl*
alias cfssl='bin/cfssl'
alias cfssljson='bin/cfssljson'
```

## Certificates

**IMPORTANT NOTES**
> To configure SSL certificate fields check out files in *conf* directory - otherwise defaults will be used

* generate CA

```
cfssl genkey -initca csr/ca-csr.json | cfssljson -bare certs/ca
```

* generate server certificates

```
cfssl gencert -ca certs/ca.pem -ca-key certs/ca-key.pem -config conf/config-ca.json -profile="server" csr/server-csr.json | cfssljson -bare certs/server
```

* generate client certificates

```
cfssl gencert -ca certs/ca.pem -ca-key certs/ca-key.pem -config conf/config-ca.json -profile="client" csr/client-csr.json | cfssljson -bare certs/client
```

* import certificate to ACM

```
aws acm import-certificate --certificate fileb://certs/server.pem --private-key fileb://certs/server-key.pem --certificate-chain fileb://certs/ca.pem
```

* example output of import command above

```
{
    "CertificateArn": "arn:aws:acm:us-east-1:XXXXXXXXXXX:certificate/9f2e7079-369f-4a14-b924-ef8429f79be4"
}
```

* create SSM parameter with certificate ARN

```
aws ssm put-parameter --type String --overwrite --name "/global/serverless-bugtracker/vpn-cert-arn" --value "arn:aws:acm:us-east-1:XXXXXXXXXXXX:certificate/9f2e7079-369f-4a14-b924-ef8429f79be4"
```

## Deploy VPN stack

* uncomment VPN stack in global-resources/template.yaml

* re-deploy Global Stack with uncommented VPN stack using any method

## OpenVPN client configuration

* list existing VPN endpoints

```
aws ec2 describe-client-vpn-endpoints --query 'ClientVpnEndpoints[*].[Tags[?Key==`Name`].Value,ClientVpnEndpointId]'
```

* example output of describe command above - name and endpoint ID

```
[
    [
        [
            "serverless-bugtracker-global-resources-vpn"
        ],
        "cvpn-endpoint-XXXXXXXXXXXXXXXXX"
    ]
]
```

* download VPN client configuration for specific VPN endpoint - use client VPN endpoint ID from output of previous command

```
aws ec2 export-client-vpn-client-configuration --client-vpn-endpoint-id cvpn-endpoint-XXXXXXXXXXXXXXXXX --output text > vpn.ovpn
```

* add SSL cert and key to ovpn config

```
echo "<cert>" >> vpn.ovpn && cat certs/client.pem >> vpn.ovpn && echo "</cert>" >> vpn.ovpn
echo "<key>" >> vpn.ovpn && cat certs/client-key.pem >> vpn.ovpn && echo "</key>" >> vpn.ovpn
```

* connect to VPN using created config

**IMPORTANT NOTES - ONLY FOR LINUX**
> On Linux OS to configure DNS to properly work via VPN these additional options must be added to vpn.ovpn 

```
script-security 2
up /etc/openvpn/update-systemd-resolved
down /etc/openvpn/update-systemd-resolved
```
