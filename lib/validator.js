import validator from "validator";

const validate = (data) => {
    if (!data || typeof data !== 'object')
        throw new Error("Request body is missing or invalid");
    
    const mandatoryField = ['firstName', "emailId", 'password', 'phoneNumber'];
    const dataKeys = Object.keys(data || {});
    const IsAllowed = mandatoryField.every((k) => dataKeys.includes(k));

    if (!IsAllowed)
        throw new Error("Some Field Missing");

    if (!validator.isEmail(data.emailId))
        throw new Error("Invalid Email");

    if (!validator.isStrongPassword(data.password))
        throw new Error("Weak Password");
}

export default validate;