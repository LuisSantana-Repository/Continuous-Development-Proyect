# Terraform Infrastructure - Modular Structure

Esta infraestructura está organizada en módulos para facilitar el mantenimiento y la reutilización.

## Estructura de Directorios

```
terraform/
├── main.tf                 # Llamadas a los módulos
├── variables.tf            # Variables de entrada
├── outputs.tf              # Outputs principales
├── user_data_api.sh        # Script de inicialización para API
├── user_data_stamin.sh     # Script de inicialización para Stamin-Up
├── aws-ec2.pub             # Llave pública SSH
└── modules/
    ├── networking/         # VPC y AMI data sources
    │   ├── main.tf
    │   └── outputs.tf
    ├── security/           # Security Groups
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── lb/                 # Application Load Balancer
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── ec2/                # Instancias EC2 y Launch Templates
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Módulos

### 1. Networking (modules/networking/)
- **Propósito**: Gestionar recursos de red y AMIs
- **Recursos**:
  - Data source para VPC por defecto
  - Data source para subnets
  - Data source para Ubuntu AMI

### 2. Security (modules/security/)
- **Propósito**: Gestionar Security Groups
- **Recursos**:
  - Security Group para ALB (puertos 80, 443)
  - Security Group para instancias EC2 (puertos 22, 3000, 3001)

### 3. Load Balancer (modules/lb/)
- **Propósito**: Gestionar el Application Load Balancer
- **Recursos**:
  - Application Load Balancer
  - Target Groups para API y Web
  - Listeners y routing rules

### 4. EC2 (modules/ec2/)
- **Propósito**: Gestionar instancias EC2 y Launch Templates
- **Recursos**:
  - SSH Key Pair
  - Launch Templates para API y Web
  - Instancias EC2
  - Target Group Attachments

## Uso

### Inicializar Terraform
```bash
cd terraform
terraform init
```

### Aplicar infraestructura
```bash
terraform apply
```
