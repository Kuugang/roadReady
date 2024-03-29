## Registration

### Buyer Register

`/buyer/register`

#### Method: POST

###### Parameters (URL Encoded)

- `email` \*
- `password` \*
- `firstName` \*
- `lastName` \*
- `phoneNumber` \*
- `address` \*
- `gender` _male/female_\*

<hr>

### Dealer Register

`/dealer/register`

#### Method: POST

###### Parameters (URL Encoded)

- `email` \*
- `password` \*
- `firstName` \*
- `lastName` \*
- `phoneNumber` \*
- `address` \*
- `gender` _male/female_ \*
- `dealershipName` \*

<hr>

### Login

#### Also returns jwt and access_token as cookies

`/user/login`

#### Method: POST

###### Parameters (URL Encoded)

- `email` \*
- `password` \*

<hr>

### Google Auth

#### Routes

`/auth/google/buyer`

`/auth/google/dealershipAgent`

#### Method: POST

###### Parameters (Request Header Cookie)

- `access_token` _access_token from google OAuth_ \*

<hr>

### Update Profile

`/user/profile`

#### Method: PUT

###### Parameters (URL Encoded)

- `firstName`
- `lastName`
- `phoneNumber`
- `address`
- `gender ` _male/female_

<hr>

### Request OTP Code

`/user/otp`

#### Method: GET

- [x] Requires cookies (access_token) sent in request header

<hr>

### Verify Buyer

`/buyer/verify`

#### Method: POST

###### Parameters (URL Encoded)

- `code` \*

<hr>

### Get Dealership

`/dealership`

#### Method: GET

###### Parameters (URL Query Params)

- ` ` - Returns all dealership
- `dealershipId`
- `dealershipName`

###### Parameters (URL Encoded)

- `latitude` `longitude` `km` -returns dealerships within _n km_ around given location

<hr>

### GET Listing

`/listing`

#### Method: GET

###### Parameters (URL Query Params)

- ` ` - Returns all listing
- `listingId`
- `dealershipId` - Returns all listing of the dealership
- `dealershipAgentId` - Returns all listing of the dealerhip agent

<hr>

### Apply Cash

`/buyer/apply/cash`

#### Method: POST

###### Parameters (multipart/form-data)

- `listingId` \*
- `signature` _image_ \*
- `validId` _image_ \*

<hr>

### Apply Installment

`/buyer/apply/installment`

#### Method: POST

###### Parameters (multipart/form-data)

- `listingId` \*
- `buyerValidId` _image_ \*
- `buyerSignature` _image_ \*
- `coMakerValidId` _image_ \*
- `coMakerSignature` _image_ \*
- `coMakerFirstName` \*
- `coMakerLastName` \*
- `coMakerPhoneNumber` \*

<hr>

### CREATE LISTING

`/dealershipagent/listing`

#### Method: POST

###### Parameters (multipart/form-data)

- `image` _image_ \*
- `modelAndName` \*
- `make` \*
- `fuelType` \*
- `power` \*
- `transmission` \*
- `engine` \*
- `fuelTankCapacity` \*
- `seatingCapacity` \*
- `price` \*
- `dealershipName` \*
- `vehicleType` \*

<hr>

# TODO

### DELETE LISTING

`/dealershipagent/listing`

#### Method: DELETE

###### Parameters (URL Encoded)

- `listingId` \*

<hr>

### UPDATE LISTING

`/dealershipagent/listing`

#### Method: PUT

###### Parameters (URL Encoded)

- `listingId` \*
- `modelAndName`,
- `make`
- `fuelType`
- `power`
- `transmission`
- `engine`
- `fuelTankCapacity`
- `seatingCapacity`
- `price`
- `vehicleType`

<hr>

### Update Application Request

`/dealershipagent/application`

#### Method: PUT

###### Parameters (URL Encoded)

###### Either Cash or Installment application

- `installmentApplicationRequest`
- `cashApplicationRequest`
- `listingId` \*
- `progress` _(1 - 5)_ \*

<hr>

### Update Registration Request

`/dealershipagent/registration`

#### Method: PUT

###### Parameters (URL Encoded)

- `registrationRequestId` \*
- `progress` _(1 - 3)_ \*

<hr>

### Update Dealership Agent Status

##### Update agent status whether they are authorized to post listing under the dealership name

`/dealershipmanager/agent`

#### Method: PUT

###### Parameters (URL Encoded)

- `agentId` \*
- `isApproved` _(true/false)_ \*

<hr>

## ADMIN

<hr>

### Update User Status

#### Update status verification for users

`/admin/users/status`

#### Method: PUT

###### Parameters (URL Encoded)

- `userId` \*
- `isApproved` _(true/false)_ \*

<hr>

### Get Users

`/admin/users`

#### Method: GET
