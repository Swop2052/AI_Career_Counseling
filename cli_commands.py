# cli_commands.py - Flask CLI management commands for SkillSense
# Usage:  flask create-super-admin
import sys
import click
from flask import Flask


def register_cli_commands(app: Flask) -> None:
    """Register all Flask CLI management commands on the application."""

    @app.cli.command("create-super-admin")
    def create_super_admin():
        """
        Create the first SUPER_ADMIN account for SkillSense.
        Refuses if a SUPER_ADMIN already exists.
        Run from the project root: flask create-super-admin
        """
        click.echo("")
        click.echo(click.style("  SkillSense -- Create Super Admin", fg="green", bold=True))
        click.echo("  -----------------------------------------")
        click.echo("  This creates the first SUPER_ADMIN account.")
        click.echo("  The account will have full platform management access.")
        click.echo("")

        full_name = click.prompt("  Full name", type=str).strip()
        if not full_name:
            click.echo(click.style("  [ERROR] Full name is required.", fg="red"))
            sys.exit(1)

        email = click.prompt("  Email address", type=str).strip().lower()
        if not email or "@" not in email:
            click.echo(click.style("  [ERROR] A valid email address is required.", fg="red"))
            sys.exit(1)

        while True:
            password = click.prompt("  Password (min 8 characters)", hide_input=True)
            if len(password) < 8:
                click.echo(click.style("  [ERROR] Password must be at least 8 characters.", fg="red"))
                continue
            confirm = click.prompt("  Confirm password", hide_input=True)
            if password != confirm:
                click.echo(click.style("  [ERROR] Passwords do not match. Try again.", fg="red"))
                continue
            break

        click.echo("")
        click.echo("  Creating SUPER_ADMIN account...")

        try:
            from services.auth_service import auth_service
            result = auth_service.create_super_admin_via_cli(
                email=email,
                password=password,
                full_name=full_name
            )
            password = None
            confirm = None

            click.echo("")
            click.echo(click.style("  [SUCCESS] SUPER_ADMIN account created!", fg="green", bold=True))
            click.echo(f"  Email:    {result['email']}")
            click.echo(f"  Role:     {result['role']}")
            click.echo(f"  User ID:  {result['id']}")
            click.echo("")
            click.echo("  Next steps:")
            click.echo("    1. Visit your SkillSense instance in a browser")
            click.echo("    2. Log in with your email and password")
            click.echo("    3. Go to Developer Dashboard -> Developer Accounts")
            click.echo("    4. Add additional developers from the dashboard")
            click.echo("")

        except ValueError as ve:
            password = None
            click.echo("")
            click.echo(click.style(f"  [ERROR] {ve}", fg="red", bold=True))
            click.echo("")
            sys.exit(1)
        except Exception as e:
            password = None
            click.echo("")
            click.echo(click.style(f"  [ERROR] Unexpected error: {e}", fg="red"))
            click.echo("")
            sys.exit(1)
