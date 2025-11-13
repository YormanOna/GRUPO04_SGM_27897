def build_response(success: bool, data=None, message: str = ""):
    return {"success": success, "data": data, "message": message}
